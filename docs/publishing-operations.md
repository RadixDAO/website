# Publishing pipeline operations

This records settings and ownership facts that cannot be inferred from workflow files. Review it
whenever publishing custody changes.

## Current decisions

- Canonical origin: `https://radixdao.org`; `www` is a permanent redirect.
- Canonical GitHub repository identity: `RadixDAO/website` (exact casing).
- GitHub environment `production`: no required reviewer and no wait timer.
- Cloudflare account: DAO-controlled, currently administered by one maintainer.
- Cloudflare API token: no scheduled expiry; the current administrator owns rotation.
- Known Cloudflare tokens in forks: none. A repository-identity guard still fails closed even if a
  token is added to a fork later.
- Publication timestamp tolerance: 15 minutes from the file's introducing commit; deviations warn
  but do not block publication.
- Notice-form authorization: effective repository permission must be write, maintain or admin.

## Deferred work

- Move the governance source repository to a DAO-controlled organization if the DAO chooses to do
  so. Repository and immutable ref are configured in `content-sources.lock`.
- Expand Cloudflare administration beyond one person.
- Deliver canary failures to a Telegram group watched by at least two people. Until then, scheduled
  failures are visible only through GitHub Actions, so REQ-03 is only partially complete.

## Evidence after each production change

The `publishing/live` commit status is authoritative for pipeline completion. It becomes green only
after the deploy and public-origin checks pass. A notice-adding commit also receives a comment with
the verified live permalink. The daily publishing canary independently checks the full build,
Cloudflare authentication, a dry-run upload compilation and the build identity served by the live
origin.
