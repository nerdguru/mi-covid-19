import datetime
import requests
import json
from requests import get
from requests.exceptions import RequestException
from contextlib import closing
from bs4 import BeautifulSoup

# Helper functions
def simple_get(url):
    try:
        with closing(get(url, stream=True)) as resp:
            if is_good_response(resp):
                return resp.content
            else:
                return None

    except RequestException as e:
        print('Error during requests to {0} : {1}'.format(url, str(e)))
        return None

def is_good_response(resp):
    content_type = resp.headers['Content-Type'].lower()
    return (resp.status_code == 200
            and content_type is not None
            and content_type.find('html') > -1)


# Get the cumulative cases page and pull out the first table
raw_html = simple_get('https://www.michigan.gov/coronavirus/0,9753,7-406-98163-520743--,00.html')
soup = BeautifulSoup(raw_html, 'html.parser')
overall_table = soup.findAll("table")[0]

# Iterate through the rows in that table
overall_table_rows = overall_table.findAll("tr")
detroit_cases = 0
detroit_deaths = 0

now = datetime.datetime.now()
day_dict = {}
day_dict['date'] = str(now).split(' ')[0]
cases_dict = {}
deaths_dict = {}
for row in overall_table_rows:
    col = row.findAll("td")
    county = col[0].get_text().strip()
    # Skip special cases
    if (county != 'County') and (county != 'Not Reported'):
        cases = int(col[1].get_text().strip().replace(",",""))
        raw_deaths_text = col[2].get_text().strip()
        if (raw_deaths_text != ''):
            deaths = int(col[2].get_text())
        else:
            deaths = 0;
        # Handle the fact that Detroit is counted separate from the rest of Wayne county
        if 'Detroit' in county :
            detroit_cases = cases
            detroit_deaths = deaths
        elif 'Wayne' in county :
            cases = cases + detroit_cases
            deaths = deaths + detroit_deaths
            cases_dict[county] = cases
            deaths_dict[county] = deaths
        else:
            cases_dict[county] = cases
            deaths_dict[county] = deaths

day_dict['cases'] = cases_dict
day_dict['deaths'] = deaths_dict
print(json.dumps(day_dict, indent=1))
f = open("data/" + str(now).split(' ')[0] + ".json", "w")
f.write(json.dumps(day_dict, indent=1))
f.close()
