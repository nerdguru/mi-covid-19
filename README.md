# mi-covid-19
On March 17, 2020 the first case of COVID-19 was diagnosed in Leelanau county Michigan, where I live.  This news prompted me to look at county level case data available from https://www.michigan.gov/coronavirus/.  The way in which data was reported there changed over the days that followed, seeing the data in a static, tabular format made it difficult to see growth trends.  While the state agencies clearly have a lot to deal with, I started to take daily snapshots of the data and produce a visualization that made it easier to see state-wide case growth trends as well as county by county.  The results are hosted here:

[http://nerdguru.net/mi-covid-19/](http://nerdguru.net/mi-covid-19/)

If you are a non-technical person who has questions, [please reach out to me on Twitter](https://twitter.com/nerdguru).  If you are a technical person who wants more detail, potentially to adapt this to your own location, keep reading.

## Technical Detail
This repo is separated into `frontend` (the static HTML page) and `backend` (the data collection and formatting) components.

### frontend
The frontend is a single page static HTML page indented to be hosted on an S3 bucket enabled as a static HTML host.  It consists of four files:

* index.html - The Bootstrap 4-based HTML page that gets loaded into browsers and references the other three files.
* style.css - The CSS that gives shape to the two visual components.
* config.js - The JavaScript file that interacts with the [amCharts 4](https://www.amcharts.com/) library to configure what is shown on the page.
* data.js - The data file that gets replaced daily given the new statistics available from the state reporting website.

In order to custoize the `frontend` to another location, in addition to producing a `data.js` from a reliable source and changing out lables in the `index.html`, the amCharts 4 JavaScript reference in the `index.html` (currently https://www.amcharts.com/lib/4/geodata/region/usa/miLow.js) and the subsequent object reference in the `config.js` (currently am4geodata_region_usa_miLow) would need to be changed to match another location.

### backend
The `backend` consists of a set of Python scripts that screen scrape the cumulative cases table from the state.  Currently, this portion is in flux given frequent changes to the formatting of that table the state has made.  `fetch.py` uses a combination of the `requests` package to obtain the raw HTML and `BeautifulSoup` to parse that raw HTML to produce a JSON structure of the daily cumulative data it simply prints to stdout.

In order to convert this so that it is useful for another location, the details of the screen scraping will need to be changed to suit the specifics of how data is reported for another location.

Next steps for the `backend` include taking the different daily data files and automate the production of a new `data.js` file that can then be uploaded to the hosting bucket.  Eventually, this entire process could be automated to be triggered off a cron job, but it's early still and there are still several manual steps for now.
