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
detroit = 0

now = datetime.datetime.now()
day_dict = {}
day_dict['date'] = str(now).split(' ')[0]
data_dict = {}
for row in overall_table_rows:
    col = row.findAll("td")
    county = col[0].get_text().strip()
    # Skip special cases
    if (county != 'County') and (county != 'Not Reported'):
        cases = int(col[1].get_text())
        # Handle the fact that Detroit is counted separate from the rest of Wayne county
        if 'Detroit' in county :
            detroit = cases
        elif 'Wayne' in county :
            cases = cases + detroit
            data_dict[county] = cases
        else:
            data_dict[county] = cases

day_dict['data'] = data_dict
print(json.dumps(day_dict, indent=1))
