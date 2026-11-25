import { describe, expect, it } from "vite-plus/test";

import {
  groupHostAccounts,
  nextHostAccountChoices,
  nextHostRepositoryAccountChoices,
} from "./SourceControlAccountSettings.logic";

describe("groupHostAccounts", () => {
  it("groups logins by host, keeping broken and environment logins out of the picker", () => {
    expect(
      groupHostAccounts([
        { host: "github.com", account: "personal", active: true, authenticated: true },
        { host: "github.com", account: "work", active: false, authenticated: true },
        { host: "github.com", account: "old", active: false, authenticated: false, error: "bad" },
        {
          host: "github.com",
          account: "bot",
          active: false,
          authenticated: true,
          environmentVariable: "GH_TOKEN",
        },
        { host: "ghe.acme.test", account: "jm", active: false, authenticated: true },
      ]),
    ).toEqual([
      {
        host: "github.com",
        activeAccount: "personal",
        selectable: ["personal", "work"],
        broken: [
          { host: "github.com", account: "old", active: false, authenticated: false, error: "bad" },
        ],
        environmentVariable: "GH_TOKEN",
      },
      {
        host: "ghe.acme.test",
        activeAccount: "jm",
        selectable: ["jm"],
        broken: [],
        environmentVariable: null,
      },
    ]);
  });
});

describe("nextHostAccountChoices", () => {
  it("pins an account, keeps other hosts, and drops a host back on the CLI defaults", () => {
    const other = { "ghe.acme.test": { enabled: false } };
    const pinned = nextHostAccountChoices(other, "github.com", { account: "work" });
    expect(pinned).toEqual({ ...other, "github.com": { enabled: true, account: "work" } });

    const disabled = nextHostAccountChoices(pinned, "github.com", { enabled: false });
    expect(disabled["github.com"]).toEqual({ enabled: false, account: "work" });

    expect(
      nextHostAccountChoices(disabled, "github.com", { enabled: true, account: null }),
    ).toEqual(other);
  });

  it("keeps repository pins across host-level account and enabled changes", () => {
    const pinned = nextHostRepositoryAccountChoices({}, "github.com", "Owner/Repo.git", "work");
    expect(pinned).toEqual({
      "github.com": { enabled: true, repositoryAccounts: { "owner/repo": "work" } },
    });

    const repicked = nextHostAccountChoices(pinned, "github.com", { account: "personal" });
    expect(repicked["github.com"]).toEqual({
      enabled: true,
      account: "personal",
      repositoryAccounts: { "owner/repo": "work" },
    });

    expect(nextHostAccountChoices(repicked, "github.com", { enabled: false })).toEqual({
      "github.com": {
        enabled: false,
        account: "personal",
        repositoryAccounts: { "owner/repo": "work" },
      },
    });
  });
});

describe("nextHostRepositoryAccountChoices", () => {
  it("pins, repins and clears a repository, keeping the host pick", () => {
    const host = {
      "github.com": {
        enabled: true,
        account: "personal",
        repositoryAccounts: { "other/repo": "work" },
      },
    };
    const pinned = nextHostRepositoryAccountChoices(host, "github.com", "owner/repo", "work");
    expect(pinned["github.com"]).toEqual({
      enabled: true,
      account: "personal",
      repositoryAccounts: { "other/repo": "work", "owner/repo": "work" },
    });

    const cleared = nextHostRepositoryAccountChoices(pinned, "github.com", "owner/repo", null);
    expect(cleared["github.com"]).toEqual({
      enabled: true,
      account: "personal",
      repositoryAccounts: { "other/repo": "work" },
    });
  });

  it("keeps the host entry after the last pin is cleared so the account pick survives", () => {
    const pinned = nextHostRepositoryAccountChoices({}, "github.com", "owner/repo", "work");
    expect(nextHostRepositoryAccountChoices(pinned, "github.com", "owner/repo", null)).toEqual({
      "github.com": { enabled: true },
    });
  });
});
