# DOT jobs page: where each state posts (checked 2026-10-16)

| State | Where | Format | Keyless | Terms / robots | Seasonal filter | Used |
|---|---|---|---|---|---|---|
| OR | oregon.wd5.myworkdayjobs.com/SOR_External_Career_Site | Workday CXS JSON (POST /wday/cxs/oregon/SOR_External_Career_Site/jobs, detail GET). Needs Accept-Language header | Yes | robots.txt allows /SOR_External_Career_Site/ | Yes: searchText "seasonal", bullet "On-Season (Seasonal)", "ODOT" in location | Yes |
| MN | dot.mn.gov/careers/job-openings.html | Static HTML list (title, location, pay, closing date, link) | Yes | robots.txt (dot.state.mn.us) disallows only /Admin/ | Title match: emergency, temporary, seasonal, snow, plow | Yes |
| WA | governmentjobs.com/careers/washington (NEOGOV) | HTML, JS | n/a | governmentjobs.com robots.txt: Disallow / for all but named search bots | n/a | Link only |
| ID | statecareers.idaho.gov (Idaho's old NEOGOV page says it moved) | not checked | n/a | not checked | n/a | Link only |
| CO | governmentjobs.com/careers/Colorado (NEOGOV) | same | n/a | same | n/a | Link only |
| UT | governmentjobs.com/careers/utah (NEOGOV) | same | n/a | same | n/a | Link only |
| MT | mtstatejobs.taleo.net (Taleo) | JS search, session based | n/a | no robots file (404), no public JSON | n/a | Link only |

Not checked yet: NV (careers.nv.gov), IN (workforindiana.in.gov), MO, IL, NY, AK.
Uncertain: whether an agency can opt in to a NEOGOV job feed. Ask NEOGOV or the agency before assuming.

Open risk (ChatGPT review P1): Workday's site terms restrict automated extraction. robots.txt allows the career site path, but whether the terms cover Oregon's tenant is unresolved. Leah decided 2026-10-16 to keep the Oregon rows. Keep pursuing written OK from ODOT.
