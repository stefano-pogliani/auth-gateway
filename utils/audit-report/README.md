# AuthGateway Audit Reporter
This nodejs tool read audit records stored in MongoDB by AuthGateway to generate
access reports.

Reports can be saved locally as HTML or emailed.
A configured SMTP server is required for email sending.

## Usage
The tool requires a YAML configuration file (named when invoked, `report.yaml` by default).
The YAML configuration file options are documented in `report.example.yaml`.

By default the tool will email the generated report.
To store it as HTML locally instead (useful for development and testing):

* Skip sending emails with `skip_email: true` in the configuration.
* Save the last generated report to a file with `report_store_last: 'last-report.html'`.
* Run the reporting tool: `npm run report`.
