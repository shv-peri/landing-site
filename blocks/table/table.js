import { fetchPlaceholders, getMetadata } from '../../scripts/aem.js';

const placeholders = await fetchPlaceholders(getMetadata('locale'));

const {
  allCountries,
  currency,
  capital,
  countries: countriesPlaceholder,
  sno,
  africa,
  america,
  asia,
  australia,
  continent,
  ocenia,
  europe,
} = placeholders;

async function createTableHeader(table) {
  const tr = document.createElement('tr');
  const sNo = document.createElement('th');
  sNo.appendChild(document.createTextNode(sno));
  const country = document.createElement('th');
  country.appendChild(document.createTextNode(countriesPlaceholder));
  const capitalh = document.createElement('th');
  capitalh.appendChild(document.createTextNode(capital));
  const continenth = document.createElement('th');
  continenth.appendChild(document.createTextNode(continent));
  const currencyh = document.createElement('th');
  currencyh.appendChild(document.createTextNode(currency));
  tr.append(sNo, country, capitalh, continenth, currencyh);
  table.append(tr);
}

async function createTableRow(table, row, i) {
  const tr = document.createElement('tr');
  const snoCell = document.createElement('td');
  snoCell.appendChild(document.createTextNode(i));
  const country = document.createElement('td');
  country.appendChild(document.createTextNode(row.Country));
  const capital = document.createElement('td');
  capital.appendChild(document.createTextNode(row.Capital));
  const continent = document.createElement('td');
  continent.appendChild(document.createTextNode(row.Continent));
  const currency = document.createElement('td');
  currency.appendChild(document.createTextNode(row.Currency));
  tr.append(snoCell, country, capital, continent, currency);
  table.append(tr);
}

async function createSelectMap(jsonURL) {
  const optionsMap = new Map();
  const { pathname } = new URL(jsonURL);

  const resp = await fetch(pathname);
  optionsMap.set('allCountries', allCountries);
  optionsMap.set('asia', asia);
  optionsMap.set('europe', europe);
  optionsMap.set('africa', africa);
  optionsMap.set('america', america);
  optionsMap.set('australia', australia);
  optionsMap.set('ocenia', ocenia);

  const select = document.createElement('select');
  select.id = 'region';
  select.name = 'region';
  optionsMap.forEach((val, key) => {
    const option = document.createElement('option');
    option.textContent = val;
    option.value = key;
    select.append(option);
  });

  const div = document.createElement('div');
  div.classList.add('region-select');
  div.append(select);
  return div;
}

const limit = 20; // Number of records per page
let offset = 0; // Starting index for records

async function createTable(jsonURL, val, limit, offset, selectChange) {
  let pathname;
  if (!selectChange) {
    pathname = val
      ? `${jsonURL}?limit=${limit}&offset=${offset}`
      : new URL(`${jsonURL}?limit=${limit}&offset=${offset}`);
  } else {
    pathname = new URL(jsonURL);
  }

  const resp = await fetch(pathname);
  const json = await resp.json();
  const table = document.createElement('table');
  await createTableHeader(table);
  json.data.forEach((row, i) => {
    createTableRow(table, row, offset + i + 1); // Adjust row number with offset
  });

  return table;
}

async function updateTable(jsonURL, parentDiv, region, limit, offset, selectChange = false) {
  const tableE = parentDiv.querySelector(':scope > table');
  const table = await createTable(jsonURL, region, limit, offset, selectChange);
  tableE.replaceWith(table);
}

function createPaginationControls(parentDiv, jsonURL, region) {
  const paginationDiv = document.createElement('div');
  paginationDiv.classList.add('pagination-controls');

  const prevButton = document.createElement('button');
  prevButton.textContent = 'Previous';
  prevButton.disabled = offset === 0; // Disable "Previous" button on the first page
  prevButton.addEventListener('click', async () => {
    if (offset > 0) {
      offset -= limit;
      await updateTable(jsonURL, parentDiv, region, limit, offset);
      prevButton.disabled = offset === 0; // Disable "Previous" button if necessary
    }
  });

  const nextButton = document.createElement('button');
  nextButton.textContent = 'Next';
  nextButton.addEventListener('click', async () => {
    offset += limit;
    await updateTable(jsonURL, parentDiv, region, limit, offset);
    prevButton.disabled = offset === 0;
  });

  paginationDiv.append(prevButton, nextButton);
  return paginationDiv;
}

export default async function decorate(block) {
  const countriesLink = block.querySelector('a[href$=".json"]');
  const parentDiv = document.createElement('div');
  parentDiv.classList.add('countries-block');

  if (countriesLink) {
    const jsonURL = countriesLink.href;
    const selectMap = await createSelectMap(jsonURL);
    const table = await createTable(jsonURL, null, limit, offset);
    const pagination = createPaginationControls(parentDiv, jsonURL, null);

    parentDiv.append(selectMap, table, pagination);
    countriesLink.replaceWith(parentDiv);

    const dropdown = document.getElementById('region');
    dropdown.addEventListener('change', async () => {
      offset = 0; // Reset offset when the region changes
      const region = dropdown.value;
      let url = jsonURL;
      if (region !== 'all') {
        url = `${jsonURL}?sheet=${region}`;
      }
      await updateTable(url, parentDiv, region, limit, offset, true);
    });
  }
}
