# Đồng bộ upstream (t3code → hgcode)

Sổ theo dõi absorb tính năng từ upstream `pingdotgg/t3code` vào fork HGCode.
Fork sửa sâu — **không merge toàn bộ**, chọn theo PR/commit.

## Quy ước upstream

- Upstream squash-merge theo PR: 1 commit trên `main` ≈ 1 PR (đuôi `(#NNNNN)`).
  Cherry-pick theo commit đơn = lấy trọn PR đó.
- Remote `upstream`: chỉ fetch, push DISABLED.

## Quy trình một đợt sync

1. `git fetch upstream`
2. Triage: `git log <base>..upstream/main --oneline` — duyệt từng dòng.
3. Với mỗi PR muốn lấy, làm trên branch sync riêng (`sync/upstream-<ngày>`):
   - `git cherry-pick -x <sha>` — luôn `-x` để message ghi SHA gốc.
   - Conflict nhẹ → resolve tay (đây là lúc hợp nhất code của ta vào feature mới).
   - Conflict nặng / upstream refactor chỗ ta đã đổi → bỏ cherry-pick, **port thủ
     công**: đọc diff PR trên GitHub, viết lại theo kiến trúc fork; message ghi
     `port of upstream #NNNNN`.
   - Không lấy → đánh dấu `skipped` kèm lý do ngắn.
4. Kiểm tra theo phạm vi: `vp run check:changed` + `vp test run <file>`.
   Không chạy repo-wide.
5. Cập nhật ledger + mục Trạng thái dưới đây, merge branch sync về nhánh đang làm.

### Lưu ý khi pick

- **Pick theo thứ tự upstream** cho các commit đụng cùng file — cherry-pick độc
  lập báo conflict giả vì thiếu context của commit đi trước (đã kiểm chứng:
  10/15 conflict "độc lập" apply sạch khi pick theo chuỗi).
- `pnpm-lock.yaml` luôn conflict tiềm năng — bỏ qua hunk lockfile, apply phần
  manifest rồi `vp i` regen.
- File i18n `translations/*.json` của fork đã re-key → mọi commit upstream thêm
  chuỗi đều conflict; port = apply code + thêm key mới theo catalog fork.

## Trạng thái

- Base (điểm fork rời upstream): `e8b28328da` — `main` giờ là product line của
  fork (không còn mirror upstream; quyết 2026-11-25 vì release workflow cần
  nằm trên default branch).
- Upstream head đã biết: `226113fee0` (2026-11-25) — đang phát hành
  `v0.1.12-nightly.*`; version space fork đã tách sang `1.x`.
- Backlog cũ (≤ `66441268e8`, 86 commit triage 2026-11-24): 81 `taken` /
  5 `ported` — **chưa apply**, đợt riêng.
- Backlog mới (`66441268e8..226113fee0`, ~866 commit): triage sơ bộ
  2026-11-25 → đợt `sync/upstream-2026-11-25` lấy 26 commit ưu tiên
  (self-update, relay, provider, github/issues), skip 5 commit cần
  dependency chain — xem mục "Đợt 2026-11-25" dưới ledger.
- Mặt va chạm fork: 606 file khác base (rebrand HGCode + locale vi),
  `git diff e8b28328da..feat/locale-vi --name-only`.
- Repo từng là shallow clone → đã `git fetch --unshallow origin` (2026-11-24).
  Không clone/fetch shallow nữa — shallow làm merge-base và rev-list sai lệch.

### Phương pháp triage (để tái hiện)

Worktree test `scratch/hgcode-synctest` tại tip `feat/locale-vi`; loop
`git cherry-pick -n <sha>` độc lập từng commit → phân loại clean/conflict; với
conflict, test lại **theo chuỗi cùng file** để tách conflict-thật khỏi
dep-order. Kết quả: 71 sạch độc lập + 10 sạch theo chuỗi + 5 conflict thật.

## Ledger

Status: `pending` chưa duyệt · `taken` cherry-pick được (`†` = phải theo chuỗi,
ghi dep) · `ported` port tay · `skipped` bỏ qua · `superseded` upstream trùng
feature fork đã có.

| Upstream   | Mô tả (gồm #PR)                                                                                       | Status | Commit phía fork | Ghi chú                                                                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------- | ------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| f32d9e11c4 | chore(devices): bump agent-device to 0.21.41 and expo-device-hub to 0.26.1 (#40095)                   | taken  | —                | —                                                                                                                                                                                      |
| c440fd19db | fix(server): delegated task result keeps the hook stop reason after progress (#37859)                 | taken  | —                | —                                                                                                                                                                                      |
| bac0508e08 | feat(web): thread chips show the sidebar's thread card on hover (#38895)                              | taken  | —                | —                                                                                                                                                                                      |
| fd108784cb | feat(scripts): add local mobile:audit CLI with before/after hit-box reports (#40102)                  | taken  | —                | —                                                                                                                                                                                      |
| b568fcbaa6 | feat(issues): a project can list issues from several Linear teams (#40023)                            | taken  | —                | —                                                                                                                                                                                      |
| 908e02ee6a | fix(web): resetting a setting no longer jumps the Settings page (#30925)                              | taken  | —                | —                                                                                                                                                                                      |
| 5d42431ec8 | test(shared): cover sessionPermissionsUnavailableMessage precedence (#39670)                          | taken  | —                | —                                                                                                                                                                                      |
| 1ec7f234ab | fix(server): t3_thread_read on a linked environment returns the newest page by default (#40003)       | taken  | —                | —                                                                                                                                                                                      |
| 71ff113795 | feat(mobile): hide test files in the thread review sheet (#26759)                                     | taken  | —                | dep của 60863edc41                                                                                                                                                                     |
| d7608621a5 | fix(mobile): a failed branch comparison no longer hides Uncommitted changes (#24841)                  | taken  | —                | dep của 60863edc41; đầu chuỗi GitVcs                                                                                                                                                   |
| 236e90e695 | refactor(scripts): rewrite mobile:audit CLI with Effect (#40118)                                      | taken† | —                | dep: fd108784cb                                                                                                                                                                        |
| 2e6b05011f | fix(web): terminal Powerline caps and slants fill their cells (#24888)                                | taken  | —                | —                                                                                                                                                                                      |
| 68299face0 | fix(mobile): outdated pull request approvals are labeled, not shown as current (#36868)               | taken  | —                | —                                                                                                                                                                                      |
| 6f94a06384 | fix(vcs): explain checkout failures caused by local changes (#23346)                                  | taken  | —                | chuỗi GitVcs                                                                                                                                                                           |
| da5bf96303 | fix(opencode): a newer model of another size no longer marks a current model legacy (#40059)          | taken  | —                | —                                                                                                                                                                                      |
| c5dc20f9f5 | fix(client): new threads from a grouped repository start in its root checkout (#37191)                | taken  | —                | —                                                                                                                                                                                      |
| aa6fe390db | fix(web): dismissing a local thread error no longer suppresses repeat errors (#40042)                 | taken  | —                | —                                                                                                                                                                                      |
| 721542cac7 | fix(web): the issue comment composer lines up with the chat composer (#39994)                         | taken  | —                | —                                                                                                                                                                                      |
| ede0f48c60 | fix(mobile): deduplicate Manage environment buttons and enlarge Add environment inputs (#39992)       | taken  | —                | —                                                                                                                                                                                      |
| 5ddb3b4b71 | fix(mobile): enlarge touch targets in Model picker, Files, Terminal, Button, and ControlPill (#40002) | taken  | —                | —                                                                                                                                                                                      |
| e97290a064 | chore(deps): upgrade Effect to 4.1.5 (#40132)                                                         | ported | —                | chỉ đụng pnpm-lock; apply manifest + `vp i`                                                                                                                                            |
| ed3b241eaa | fix(server): signed URLs are logged and traced with the token redacted (#40133)                       | taken  | —                | dep của b84cd4b9a5                                                                                                                                                                     |
| 4d4ec7be5c | fix(mobile): eliminate duplicate menu buttons and hidden search headers on Android (#39988)           | taken  | —                | —                                                                                                                                                                                      |
| 26b48d2da8 | fix(antigravity): show skills listed by file in manifests (#40020)                                    | taken  | —                | dep của 367f9d3759                                                                                                                                                                     |
| 7f67ad9bcb | fix(ci): agent context budget compares with the PR's own base, not a newer main (#40071)              | taken  | —                | —                                                                                                                                                                                      |
| 13226b1c21 | fix(mobile): Android composer blur no longer hides another field's keyboard (#34001)                  | taken  | —                | —                                                                                                                                                                                      |
| 16a79dea3d | docs(skills): document running mobile:audit CLI in test-t3-mobile (#40150)                            | taken  | —                | —                                                                                                                                                                                      |
| b84cd4b9a5 | test: stop testing that redaction config is set (#40151)                                              | taken† | —                | dep: ed3b241eaa                                                                                                                                                                        |
| 220a2b86e2 | fix(server): idle Git polls no longer re-read local status when no ref moved (#40093)                 | taken  | —                | —                                                                                                                                                                                      |
| 1f8f3698b0 | fix(server): t3_thread_wait with untilOutput returns for a run never asked for a result (#40137)      | taken  | —                | —                                                                                                                                                                                      |
| d46cbd0881 | fix(mobile): Queued follow-up no longer shows a second Working row (#40072)                           | taken  | —                | —                                                                                                                                                                                      |
| 73e6472545 | fix(client-runtime): recover thread messages after a failed resume (#24583)                           | ported | —                | code sạch; conflict 10 json i18n mobile (rekey)                                                                                                                                        |
| 80871270f9 | perf(server): ask npm once per global prefix for provider latest versions (#40109)                    | taken  | —                | —                                                                                                                                                                                      |
| 6f82dd9e79 | fix(server): skip the image attempt for Claude models that rejected images (#40087)                   | taken  | —                | —                                                                                                                                                                                      |
| 3a91757430 | fix(antigravity): keep turns open when a background wake is still pending (#39989)                    | taken  | —                | —                                                                                                                                                                                      |
| ef9b826f53 | fix(mobile): the iPad tab bar keeps its size on Usage (#39995)                                        | taken  | —                | —                                                                                                                                                                                      |
| 3d6336137b | feat(server): detect Flutter project icons from web/favicon.png (#29089)                              | taken  | —                | —                                                                                                                                                                                      |
| 8d3a311d5d | fix(github): ci_logs explains why a check has no log (#40156)                                         | taken  | —                | —                                                                                                                                                                                      |
| 39480b5c88 | fix(opencode): custom models can go back to the default reasoning level (#27333)                      | taken  | —                | dep của 9f9ebf61fb                                                                                                                                                                     |
| 670092dcf6 | fix(web): screen readers can tell removed lines from added ones in diffs (#40152)                     | taken  | —                | —                                                                                                                                                                                      |
| c688453acd | fix(claude): keep truncated request, error, and snippet text valid Unicode (#40075)                   | taken  | —                | —                                                                                                                                                                                      |
| cfb720fa8a | fix(web): guest share status expires at exact timestamp instead of start of minute (#40131)           | taken  | —                | —                                                                                                                                                                                      |
| e97e360cfc | fix(web): Option + a letter records the letter, not the macOS glyph (#39967)                          | taken  | —                | —                                                                                                                                                                                      |
| 386c8b68ca | fix(mobile): the iOS status pill stays below the header above a tall question (#40104)                | taken  | —                | —                                                                                                                                                                                      |
| 2c42752892 | fix(server): explain host CLI failures when PR watches stop (#35145)                                  | ported | —                | conflict PullRequestWatchReactor.ts (fork sửa orchestration-v2)                                                                                                                        |
| 1de7eaecec | fix(server): merged-worktree cleanup finds pull requests merged inside a fork (#40110)                | taken  | —                | —                                                                                                                                                                                      |
| c6c796e37f | fix(mobile): iOS settings switches center on rows with a description (#40128)                         | taken  | —                | —                                                                                                                                                                                      |
| 3f5492fcf4 | fix(server): storage cleanup removes worktrees with dangling gitlinks (#40119)                        | taken  | —                | —                                                                                                                                                                                      |
| 60863edc41 | feat(projects): a project covers several repositories (#35925)                                        | ported | —                | feat lớn ~200 file, đợt riêng; dep: 71ff113795+d7608621a5; conflict thật: i18n×20, Migrations.ts, reconcileV2PreviewMigration.test.ts, agentContextBudget.json, runtimeInstructions.ts |
| 87707319cf | fix(server): tell threads when a provider runtime exit kills their background work (#40170)           | ported | —                | conflict RestartContinuation.ts (fork sửa orchestration-v2)                                                                                                                            |
| cf94598281 | fix(client-runtime): don't ask for a provider update the install channel lacks (#39966)               | taken  | —                | —                                                                                                                                                                                      |
| 138da84b79 | fix(mobile): reloading changes restarts the diff from page one after a failed page (#40171)           | taken  | —                | —                                                                                                                                                                                      |
| a0ca0bfaf2 | perf(server): resolve a branch's base once while its refs and config are unchanged (#40125)           | taken  | —                | chuỗi GitVcs                                                                                                                                                                           |
| dcd8df806d | fix(web): hub accounts whose usage read fails no longer vanish silently (#36939)                      | taken  | —                | —                                                                                                                                                                                      |
| d9fdd02523 | fix(client-runtime): @ menu offers machines the thread's server links to (#40191)                     | taken  | —                | —                                                                                                                                                                                      |
| 1dd69850c9 | fix(server): a desktop preview resize the window never draws now fails (#40081)                       | taken  | —                | —                                                                                                                                                                                      |
| 367f9d3759 | fix(antigravity): skills.json ~/ entries no longer list skills agy never loads (#40194)               | taken† | —                | dep: 26b48d2da8                                                                                                                                                                        |
| 2af435185e | perf(server): branch PR lookups start 9 git processes instead of 14 (#40153)                          | taken  | —                | —                                                                                                                                                                                      |
| 982bbcdfe1 | fix(server): terminal history drops OSC 4 palette queries (#40149)                                    | taken  | —                | —                                                                                                                                                                                      |
| f4b8be84a0 | fix(web): show custom theme backgrounds on the empty New thread screen (#40069)                       | taken  | —                | —                                                                                                                                                                                      |
| 9168ca73d0 | fix(server): reuse an unchanged local Codex's version check across restarts (#40176)                  | taken  | —                | —                                                                                                                                                                                      |
| 9f9ebf61fb | fix(client-runtime): recognize thought_level and role: reasoning in effort summaries (#40136)         | taken† | —                | dep: 39480b5c88                                                                                                                                                                        |
| 797038ec5f | fix(mobile): Vietnamese letters stay bold in bold text on Android (#40205)                            | taken  | —                | liên quan locale vi                                                                                                                                                                    |
| 7ef0558f75 | fix(desktop): preview tabs drop a destroyed webview's WebContents (#40177)                            | taken  | —                | —                                                                                                                                                                                      |
| baf7e5b15a | fix(acp): persist context usage reported after a turn ends (#40220)                                   | taken  | —                | —                                                                                                                                                                                      |
| 67933a2236 | perf(server): complete Changes preview reuses its tracked-only pass (#40211)                          | taken† | —                | chuỗi GitVcs (.test conflict giả)                                                                                                                                                      |
| 511447a9f2 | feat(server): add a TanStack Source forge and issue tracker behind T3CODE_TANSTACK_SOURCE (#40207)    | taken  | —                | —                                                                                                                                                                                      |
| 2c01259fb4 | perf(server): remote status polls read HEAD, upstream and remotes once (#40162)                       | taken  | —                | chuỗi GitVcs                                                                                                                                                                           |
| d51d8c4766 | fix(client-runtime): opening the Diff panel reads each file patch once (#40217)                       | taken  | —                | —                                                                                                                                                                                      |
| 28bcb73736 | fix(web): floating device preview keeps its stream across thread switches (#40240)                    | taken  | —                | —                                                                                                                                                                                      |
| 5aae5578de | fix(web): show the update capsule label in narrower sidebars                                          | taken  | —                | đầu chuỗi capsule                                                                                                                                                                      |
| dea657a0b1 | fix(web): show the update capsule at default sidebar width with a short grow-in                       | taken† | —                | dep: 5aae5578de                                                                                                                                                                        |
| 4be39cf01a | fix(web): keep the update icon in place while the capsule shrinks                                     | taken† | —                | chuỗi capsule                                                                                                                                                                          |
| 1425613b9d | fix(web): keep restart seconds visible in narrow sidebars                                             | taken† | —                | chuỗi capsule                                                                                                                                                                          |
| b19ca97827 | fix(web): inline file and thread chips can be removed during dictation (#40252)                       | taken  | —                | —                                                                                                                                                                                      |
| bb0d718b31 | fix(web): typing and pasting no longer write into the read-only composer during dictation (#40253)    | taken  | —                | —                                                                                                                                                                                      |
| 0fd4822887 | fix(server): per-file diff reads reuse the preview's merge base (#40216)                              | taken† | —                | chuỗi GitVcs (.ts conflict giả — theo chuỗi sạch)                                                                                                                                      |
| 714997c420 | fix(acp-registry): reinstall the current version when a cached build was removed upstream (#40261)    | taken  | —                | —                                                                                                                                                                                      |
| 0b02be3d5f | fix(server): Claude's answer before a late-read steer stays visible (#40265)                          | taken  | —                | —                                                                                                                                                                                      |
| d5f8a7573a | fix(web): RTF previews hide tracked deletions (#40264)                                                | taken  | —                | —                                                                                                                                                                                      |
| 0dc32b5c8b | perf(server): an untracked file's Diff panel patch no longer copies the whole Git index (#40268)      | taken  | —                | —                                                                                                                                                                                      |
| c1464d6774 | perf(server): status of a repository without a remote skips remote lookups (#40277)                   | taken† | —                | chuỗi GitVcs (.test conflict giả)                                                                                                                                                      |
| 3d8a02371b | fix(forgejo): issue links on a self-hosted Forgejo hostname resolve (#40271)                          | taken  | —                | —                                                                                                                                                                                      |
| 47525fa3d6 | fix(web): switching threads no longer restarts the Changes and git status reads (#40215)              | taken  | —                | —                                                                                                                                                                                      |
| 0854259384 | fix(web): clipped Files tree names show the full name on hover (#40308)                               | taken  | —                | —                                                                                                                                                                                      |
| 66441268e8 | fix(cli): update Windows launchers outside PATH (#40309)                                              | taken  | —                | —                                                                                                                                                                                      |

### Đợt 2026-11-25 (`sync/upstream-2026-11-25` → `feat/locale-vi`)

26 pick từ `66441268e8..226113fee0` (ưu tiên vùng fork đang dùng). 2 pick phụ
thuộc (`9ad5e2ce66`, `3b829b6aa6`) được kéo theo vì pick chính cần chúng.

| Upstream   | Mô tả                                                                  | Commit fork | Ghi chú                                                                                         |
| ---------- | ---------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| f46fa62d59 | feat(github): issues theo GitHub issue statuses (#41795)               | 91d55ff44c  | conflict: thread `input.scope` vào status ops; `IssueLinkMetadata` op chết → regen `fcb0e124a3` |
| 4cff209428 | fix(server): Chrome 158.0.8127.88 security bump (#42043)               | dd07fa7024  | —                                                                                               |
| 74d73ac23f | fix(web): thread link env chưa connect hiện lý do (#42048)             | 7567521f4f  | 10 json i18n (HEAD trống)                                                                       |
| 59fe770e01 | fix(web): PR review draft sống qua reload (#42090)                     | f2dfad685e  | —                                                                                               |
| f692811b95 | fix(server): Windows EPERM trong serviceSelectionLock (#42103)         | dc04d0ef67  | —                                                                                               |
| 9ad5e2ce66 | fix(server): git lệnh không fork cả server trên Linux (#31488)         | 3c50af4519  | dep của 4c31da157b                                                                              |
| 4c31da157b | fix(server): agent CLI qua ProcessLauncher không hiện Servers (#42151) | 50d1c9507e  | dep: 9ad5e2ce66; PortScanner resolve theirs + bổ sung `DEVTOOLS_PORT_ARGUMENT`                  |
| 13b7893ac0 | fix(server): provider update timeout không giết installer (#42171)     | 16c03803e5  | —                                                                                               |
| 2911f58ae3 | fix(cli): `t3 install` cảnh báo PATH tương đối che launcher (#42221)   | ea95e1d942  | auto-merge qua vùng alias; install.test fail 2 case Windows (tìm `t3`, code cần `t3.cmd`)       |
| cb207e9f60 | fix(web): search dài không vỡ ký tự cuối (#42228)                      | 770047be69  | test conflict → giữ cả 2 test                                                                   |
| 01962d4c0b | fix(bitbucket): checkout ssh.bitbucket.org khớp PR (#42330)            | 510d4738de  | —                                                                                               |
| cad8cd0937 | fix(server): tôn trọng sort "created" trong IssueService.list (#42350) | a8a13963b7  | —                                                                                               |
| 4eccb0ecfc | fix(relay): traces không ghi IP/user-agent caller (#42380)             | fea58cb16a  | —                                                                                               |
| 3380585e1b | feat(relay): xoá relay data khi Clerk xoá user (#42285)                | a7b0c72cce  | modify/delete 2 docs fork đã bỏ → giữ xoá                                                       |
| dc7b8802b8 | fix(connect): tôn trọng tracing opt-out, bỏ machine details (#42356)   | 5a33c6ca5b  | 10 mobile i18n → giữ ours + theirs; en.json rebrand HG Connect                                  |
| a2231ca59b | fix(web): Cmd/Ctrl+W đóng tab trên trang Issues (#42417)               | f04c29c717  | —                                                                                               |
| c9ba6b4b6e | fix(relay): xoá account rớt tunnel connector đang sống (#42430)        | bf993f9771  | —                                                                                               |
| 30f141e2e7 | fix(server): webhook run qua relay không export span (#42450)          | d045eb53a3  | —                                                                                               |
| 49ef156624 | fix(server): relay tracing đợi desktop shell env (#42464)              | 6a3e1fd12d  | —                                                                                               |
| 2a11e76561 | fix(relay): Android push gửi per-device hash thay user id (#42459)     | edc8d8a2dc  | —                                                                                               |
| 3b829b6aa6 | fix(web): Esc trong model search chỉ xoá search (#42130)               | f3ba0ba086  | dep của 9ca304dabe (tạo browser test file)                                                      |
| 9ca304dabe | fix(web): Enter connect trong text generator wizard (#42449)           | 3c60311154  | dep: 3b829b6aa6                                                                                 |
| 2210f2d733 | fix(github): approve workflow trên PR same-repo (#26561)               | c3e3c8ced0  | —                                                                                               |
| 3d4fd8346e | fix(web): filter author/label dài không vỡ ký tự (#42563)              | e9bc883b5f  | —                                                                                               |
| 4da8d19d08 | fix(server): Antigravity auto-update thực sự tắt (#42545)              | 9e6f68a17e  | —                                                                                               |
| 03fa7cfc10 | fix(gitlab): incident link đọc như issue link (#42605)                 | 8271a287b0  | —                                                                                               |
| d8354f83e4 | fix(server): xác nhận update committed rồi mới xoá backup (#42659)     | 5990497cb4  | —                                                                                               |
| fcb0e124a3 | fix regen graphql — không phải upstream                                | —           | bỏ `IssueLinkMetadata` khỏi group (op chết, không caller)                                       |

Skipped (cần dependency chain — lấy khi pick cả chuỗi):

| Upstream   | Mô tả                                               | Cần                                    |
| ---------- | --------------------------------------------------- | -------------------------------------- |
| 00070b8031 | t3_project_create/update lưu actions (#42128)       | trackedFolders + refactor `commit`     |
| ddaba13471 | t3_project_update lưu default model (#42297)        | cùng chuỗi trên                        |
| 38adba87b3 | Claude không hiện "Connecting" mỗi turn (#42508)    | `claudeProgramReader` từ a09738fb43    |
| 02d104f7e0 | hiện tiến trình DB migration khi khởi động (#37209) | `makeRecovery` từ e0267fe880 (desktop) |
| a03bbfc44a | workflow schedule bigint nanoseconds crash (#42607) | durable workflows e414cfd4be           |

### Đợt 2026-11-25-provider (`sync/upstream-2026-11-25-provider` → `feat/locale-vi`)

19 pick nhóm provider (Claude/Codex/OpenCode/update lifecycle) từ cùng range
`66441268e8..226113fee0`. 2 dep (`b34d8b5bd5`, `404dd5bad2`) phát hiện giữa đường
qua typecheck — pick bổ sung để đủ API.

| Upstream   | Mô tả                                                                      | Commit fork | Ghi chú                                                                                            |
| ---------- | -------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| c688453acd | fix(claude): text cắt giữ valid Unicode (#40075)                           | ad98f3c665  | —                                                                                                  |
| 9563012455 | fix(server): provider tìm shell PATH đến sau startup (#31169)              | 8139cc36ef  | —                                                                                                  |
| e632155b3a | fix(claude): đo context từ main-model pass cuối (#41816)                    | d54270b339  | ClaudeAdapterV2: theirs 3 hunk + `optionalClaudeUsageTokenCount`; fixup squash `Math.max(output)`   |
| 74382f2530 | fix(server): subagent foreground hiện model của nó (#39729)                | 3b67e518a8  | —                                                                                                  |
| 28d6719114 | fix(server): kill Claude CLI Windows giết luôn shell con (#41857)          | e2715328fe  | —                                                                                                  |
| 5f19e91e85 | fix(opencode): model list theo catalog sau snapshot (#41626)               | 76d47eba17  | dep của f516cf9de8                                                                                 |
| f516cf9de8 | fix(opencode): project skills trong / menu từ snapshot đầu (#42080)        | f3ad08d75e  | driver.ts theirs; cần `connections` stream + signature `processEnv` → kéo dep b34d8b5bd5           |
| 43a0e74fb9 | fix(server): `t3_thread_launch` validate modelSelection (#42106)           | 546b5ad1c5  | handlers.ts: `assertProjectWorktree`→`projectWorktreePath`; downstream dùng `workspaceStrategy`    |
| 94190c63f9 | fix(server): OpenCode steers giữ $skill mentions (#42141)                  | cdb75fe583  | —                                                                                                  |
| fdce61c022 | fix(server): Codex command shell thoát hết hiện Running (#42212)           | 6fc11fbdde  | —                                                                                                  |
| 1a01d7ee6f | fix(server): Claude hỏi MCP sign-in 1 lần/thread (#42263)                  | 560084c497  | —                                                                                                  |
| 84e4264bb3 | fix(server): analytics không đọc/gửi account IDs (#42299)                  | f94cbfb8c1  | ProviderDimensions/ProviderUsageAnalytics theirs; telemetry.md theirs + rebrand                    |
| 6b3899f224 | fix(server): custom models báo `custom:<provider>` (#42465)                | d86b762255  | cùng vùng analytics — theirs                                                                       |
| 5e3bc17587 | fix(server): ClaudeHome qua symlink giữ session khi switch (#42509)        | a623d1120d  | —                                                                                                  |
| b2f56cc0aa | fix(server): Claude import giữ question sau quoted cmd (#42674)            | 7fe92a9ee4  | —                                                                                                  |
| feecca53e4 | fix(provider-core): refresh không giết npm check đang chạy (#42687)        | 36b50df134  | —                                                                                                  |
| 13c5b0f207 | fix(server): PR writer credit model thread, không phải nó (#26946)         | 646125e5bf  | bị lint-staged rollback nuốt 2 lần → re-pick; evals resolve theirs; cần dep 404dd5bad2             |
| b34d8b5bd5 | fix(opencode): model list nhận config edit khi server stop (#41813)        | 6523772ee7  | dep của f516cf9de8; driver.ts conflict → keep ours (đã có followScans mới hơn)                     |
| 404dd5bad2 | fix(server): Conventional Commits giữ prefix trong PR title (#40571)       | 41cde67557  | dep của 13c5b0f207 (`hasConventionalCommitPrefix`); evals conflict → keep ours                     |

Gate: `check:changed` xanh sau khi pick đủ dep; fixup `output_tokens` squash vào
`d54270b339` qua `git rebase --autosquash`.
