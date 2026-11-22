// @effect-diagnostics anyUnknownInErrorContext:off layerMergeAllWithDependencies:off - Alchemy provider helpers expose framework-owned any requirements.
import * as Alchemy from "alchemy";
import * as Output from "alchemy/Output";
import * as Axiom from "@alchemy.run/axiom";
import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Drizzle from "@alchemy.run/drizzle";
import { runMigrations, withPgExecutor } from "@alchemy.run/sql/Migrations";
import { stripSslQueryParams } from "@alchemy.run/sql/PostgresDriver";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Cause from "effect/Cause";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Redacted from "effect/Redacted";
import * as Planetscale from "@alchemy.run/planetscale";

import { PublishClientConfig, tokenDigest } from "./src/clientConfig.ts";
import * as RelayDb from "./src/db.ts";
import { MobileSourceMapsUploadCredentials, RelayObservability } from "./src/observability.ts";
import { isPreviewStage } from "./src/previewStages.ts";
import { PreviewTunnelSweep, PreviewTunnelSweepProvider } from "./src/previewTunnelSweep.ts";
import { ManagedEndpointZone, RelayApiZone, RelayDeploymentConfig } from "./src/zone.ts";
import * as RelayWorker from "./src/worker.ts";

export default Alchemy.Stack(
  "T3CodeRelay",
  {
    providers: Layer.mergeAll(
      Axiom.providers(),
      Cloudflare.providers(),
      Drizzle.providers(),
      Planetscale.providers(),
      PreviewTunnelSweepProvider(),
    ),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const { stage } = yield* Alchemy.Stack;
    // Self-host: apply migrations from the deploy host when RELAY_DATABASE_URL
    // points at external Postgres (Neon & co). db.ts must not do this — it also
    // runs inside the worker bundle, which has no filesystem.
    const relayDatabaseUrl = yield* Config.option(Config.Redacted("RELAY_DATABASE_URL"));
    if (
      Option.isSome(relayDatabaseUrl) &&
      Redacted.value(relayDatabaseUrl.value).trim().length > 0
    ) {
      yield* runMigrations({
        input: { dir: "./migrations/postgres", table: "relay_migrations" },
        stamped: {},
        withExecutor: (apply) =>
          withPgExecutor(
            {
              connectionString: stripSslQueryParams(Redacted.value(relayDatabaseUrl.value)),
              ssl: { rejectUnauthorized: true },
            },
            apply,
          ),
      }).pipe(Effect.provide(NodeServices.layer), Effect.orDie);
    }
    const db = yield* RelayDb.PlanetscaleDatabase;
    const hyperdrive = yield* RelayDb.RelayHyperdrive;
    const managedEndpointZone = yield* ManagedEndpointZone.pipe(Effect.orDie);
    const relayApiZone = yield* RelayApiZone.pipe(Effect.orDie);
    const observability = yield* RelayObservability;
    // Self-host: the deploy token may lack Account API Tokens Write, which the
    // sourcemaps upload credential needs. Degrade to empty credentials — that
    // output only feeds the optional MOBILE_SOURCEMAPS_R2 CI/EAS secret.
    const mobileSourceMapsUploadCredentials = yield* MobileSourceMapsUploadCredentials.pipe(
      Effect.catchCause((cause) =>
        Effect.logWarning(
          `Skipping mobile sourcemaps upload credentials: ${Cause.pretty(cause)}`,
        ).pipe(Effect.as(Output.literal(Redacted.make("{}")))),
      ),
    );
    const api = yield* RelayWorker.Api;
    if (isPreviewStage(stage)) {
      const { managedEndpointZoneName } = yield* RelayDeploymentConfig;
      yield* PreviewTunnelSweep("PreviewTunnelSweep", {
        stage,
        tunnelZoneName: managedEndpointZoneName,
        workerName: api.workerName,
      });
    }
    yield* PublishClientConfig({
      url: api.url,
      mobileTracingUrl: observability.traces.otelTracesEndpoint,
      mobileTracingDataset: observability.traces.name,
      mobileTracingToken: observability.mobileIngestToken.token,
      clientTracingUrl: observability.traces.otelTracesEndpoint,
      clientTracingDataset: observability.traces.name,
      clientTracingToken: observability.clientIngestToken.token,
      tokenDigest: Output.map(
        Output.all(observability.mobileIngestToken.token, observability.clientIngestToken.token),
        tokenDigest,
      ),
    });

    return {
      databaseName: db.database.name,
      databaseBranchName: db.branch?.name ?? "main",
      hyperdriveName: hyperdrive.name,
      workerName: api.workerName,
      url: api.url,
      relayApiZoneId: relayApiZone.zoneId,
      managedEndpointZoneId: managedEndpointZone.zoneId,
      mobileTracingUrl: observability.traces.otelTracesEndpoint,
      mobileTracingDataset: observability.traces.name,
      mobileTracingToken: observability.mobileIngestToken.token,
      clientTracingUrl: observability.traces.otelTracesEndpoint,
      clientTracingDataset: observability.traces.name,
      clientTracingToken: observability.clientIngestToken.token,
      mobileLogsDataset: observability.mobileLogs.name,
      mobileMetricsDataset: observability.mobileMetrics.name,
      mobileSourceMapsBucket: observability.mobileSourceMaps.bucketName,
      // The MOBILE_SOURCEMAPS_R2 secret for GitHub Actions and EAS Build.
      mobileSourceMapsUploadCredentials,
    };
  }).pipe(Effect.provide(RelayWorker.layer)),
);
