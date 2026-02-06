# Fastmail MCP Server

MCP server for Fastmail — email, contacts, and calendars via JMAP and CalDAV.

Fork of [MadLlama25/fastmail-mcp](https://github.com/MadLlama25/fastmail-mcp) with:

- **CalDAV calendar support** — tsdav-based with date range filtering and recurring event expansion. Fastmail's [JMAP calendar support is coming soon](https://www.fastmail.com/dev/) — this fork uses CalDAV as a self-service workaround until then.
- **Native fetch** — dropped `node-fetch` dependency (Node 18+).

## Setup

### Tokens

| Variable | Required | What it is |
|----------|----------|------------|
| `FASTMAIL_API_TOKEN` | Yes | API token with `urn:ietf:params:jmap:mail` scope (read-only is fine) |
| `FASTMAIL_CALDAV_API_TOKEN` | No | App password with CalDAV permissions |
| `FASTMAIL_CALDAV_USERNAME` | No | Your Fastmail email address — required if `FASTMAIL_CALDAV_API_TOKEN` is set |

**Creating the API token** — Settings → Privacy & Security → API Tokens → New API Token. Grant `urn:ietf:params:jmap:mail` (and optionally contacts/submission scopes).

**Creating the app password** — Settings → Privacy & Security → Manage app passwords and access → New app password. Select "CalDAV" as the access type.

The JMAP token **cannot** access calendars — it returns "Disallowed". Calendar operations use CalDAV with basic auth until Fastmail ships JMAP calendar support.

### MCP config

```json
{
  "mcpServers": {
    "fastmail": {
      "command": "npx",
      "args": ["--yes", "github:stevethomas/fastmail-mcp"]
    }
  }
}
```

## Tools

31 tools covering email, contacts, and calendars. Tool descriptions are self-documenting via MCP — run `check_function_availability` for a full inventory and setup guidance.

### Highlights

- **get_recent_emails** — quick inbox scan
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
npm install
npm run build
npm run dev    # watch mode
```

## License

MIT
