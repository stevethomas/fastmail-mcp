# Fastmail MCP Server

MCP server for Fastmail — email, contacts, and calendars via JMAP and CalDAV.

Fork of [MadLlama25/fastmail-mcp](https://github.com/MadLlama25/fastmail-mcp) with:

- **CalDAV calendar support** — tsdav-based with date range filtering and recurring event expansion. Fastmail's [JMAP calendar support is coming soon](https://www.fastmail.com/dev/) — this fork uses CalDAV as a self-service workaround until then.
- **Snooze metadata** — `snoozed` property exposed on email responses (includes `until` date for unsnooze scheduling).
- **Native fetch** — dropped `node-fetch` dependency (Node 18+).

## Setup

### Tokens

Two separate tokens are required:

| Token | Scope | How to get |
|-------|-------|------------|
| `FASTMAIL_API_TOKEN` | JMAP (email, contacts) | Settings → Privacy & Security → API Tokens |
| `FASTMAIL_CALDAV_API_TOKEN` | CalDAV (calendars) | Settings → Privacy & Security → Manage app passwords and access → create token with CalDAV scope |

The JMAP token **cannot** access calendars — it returns "Disallowed". Calendar operations use CalDAV with basic auth until Fastmail ships JMAP calendar support.

### Install

```bash
npm install
npm run build
```

### MCP config

```json
{
  "mcpServers": {
    "fastmail": {
      "command": "node",
      "args": ["/path/to/fastmail-mcp/dist/index.js"],
      "env": {
        "FASTMAIL_API_TOKEN": "...",
        "FASTMAIL_CALDAV_API_TOKEN": "..."
      }
    }
  }
}
```

## Tools

31 tools covering email, contacts, and calendars. Tool descriptions are self-documenting via MCP — run `check_function_availability` for a full inventory and setup guidance.

### Highlights

- **get_recent_emails** — quick inbox scan with snooze metadata
- **advanced_search** — multi-criteria filtering (sender, date, attachments, read status)
- **send_email** — text/HTML with proper draft/sent handling
- **list_calendar_events** — CalDAV-backed with date range support
- **bulk_mark_read / bulk_move / bulk_delete** — batch operations

## Project structure

```
src/
├── index.ts              # MCP server entry point
├── auth.ts               # JMAP authentication
├── jmap-client.ts        # JMAP client (email operations)
├── contacts-calendar.ts  # Contacts + CalDAV calendar
└── caldav-client.ts      # CalDAV client (tsdav wrapper)
```

## Development

```bash
npm run dev    # watch mode
npm run build  # production build
```

## License

MIT
