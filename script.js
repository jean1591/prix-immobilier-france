// Search
const streetNb = document.getElementById("street-nb");
const streetName = document.getElementById("street-name");
const radius = document.getElementById("radius");
const city = document.getElementById("city");
const submitBtn = document.getElementById("submit-btn");

// Results
const streetDetails = document.getElementById("street-details");
const cityDetails = document.getElementById("city-details");
const radiusDetails = document.getElementById("radius-details");
const pResults = document.getElementById("p-results");
const displayBtn = document.getElementById("display-btn");
const downloadBtn = document.getElementById("download-btn");

// Table
const tableResults = document.getElementById("table-results");

// Properties array & Erase table
let propertiesArr = [];

// Fetch properties from API by search coordinates
const getProperties = async () => {
	// Get coordinates from address
	const streetDetails = `${streetNb.value}+${streetName.value.replace(" ", "+")}`;
	let coords = await fetch(
		`https://nominatim.openstreetmap.org/search?street=${streetDetails}&city=${city.value}&format=json`
	);
	coords = await coords.json();

	// Get properties from API
	const dist = radius.value ? radius.value : 200;
	let res = await fetch(
		`https://api.cquest.org/dvf?lat=${coords[0].lat}&lon=${coords[0]
			.lon}&dist=${dist}&nature_mutation=Vente`
	);
	res = await res.json();

	let resFiltered = res.features.filter(
		(d) =>
			d.properties.nature_mutation === "Vente" &&
			[ "Maison", "Appartement" ].includes(d.properties.type_local)
	);

	resFiltered = resFiltered.map((d) => {
		return {
			date_mutation: d.properties.date_mutation,
			numero_voie: d.properties.numero_voie,
			type_voie: d.properties.type_voie,
			voie: d.properties.voie,
			code_postal: d.properties.code_postal,
			commune: d.properties.commune,
			type_local: d.properties.type_local,
			valeur_fonciere: d.properties.valeur_fonciere,
			surface_relle_bati: d.properties.surface_relle_bati,
			nombre_pieces_principales: d.properties.nombre_pieces_principales,
			lat: d.properties.lat,
			lon: d.properties.lon
		};
	});

	return resFiltered;
};

// Convert array to CSV
const convertToCSV = (objArray) => {
	var array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
	var str = "";

	for (var i = 0; i < array.length; i++) {
		var line = "";
		for (var index in array[i]) {
			if (line != "") line += ",";

			line += array[i][index];
		}

		str += line + "\r\n";
	}

	str =
		"date_mutation,numero_voie,type_voie,voie,code_postal,commune,type_local,valeur_fonciere,surface_relle_bati,nombre_pieces_principales,lat,lon" +
		"\r\n" +
		str;

	return str;
};

// Download CSV file
const downloadCSV = () => {
	// Transform to CSV
	const propertiesCSV = convertToCSV(propertiesArr);

	var blob = new Blob([ propertiesCSV ]);
	if (window.navigator.msSaveOrOpenBlob) window.navigator.msSaveBlob(blob, "filename.csv");
	else {
		var a = window.document.createElement("a");
		a.href = window.URL.createObjectURL(blob, { type: "text/plain" });
		a.download = "filename.csv";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
};

// Create table headers
const createTableHeaders = () => {
	const thead = document.createElement("thead");
	thead.classList.add("thead-light");

	const tr = document.createElement("tr");

	const dateTh = document.createElement("th");
	dateTh.innerText = "Date";
	const streetTh = document.createElement("th");
	streetTh.innerText = "Rue";
	const cityTh = document.createElement("th");
	cityTh.innerText = "Ville";
	const typeTh = document.createElement("th");
	typeTh.innerText = "Type";
	const surfaceTh = document.createElement("th");
	surfaceTh.innerText = "Surface";
	const priceTh = document.createElement("th");
	priceTh.innerText = "Prix";
	const nbRoomTh = document.createElement("th");
	nbRoomTh.innerText = "Nb Pièces";

	tr.appendChild(dateTh);
	tr.appendChild(streetTh);
	tr.appendChild(cityTh);
	tr.appendChild(typeTh);
	tr.appendChild(surfaceTh);
	tr.appendChild(priceTh);
	tr.appendChild(nbRoomTh);

	thead.appendChild(tr);
	tableResults.appendChild(thead);
};

// Create table body
const createTableBody = () => {
	const tbody = document.createElement("tbody");

	// Fill table
	propertiesArr.forEach((p, index) => {
		if (index < 100) {
			const tr = document.createElement("tr");

			const {
				date_mutation,
				commune,
				nombre_pieces_principales,
				surface_relle_bati,
				type_local,
				valeur_fonciere,
				voie,
				type_voie
			} = p;

			const dateTd = document.createElement("td");
			dateTd.innerText = date_mutation;
			const streetTd = document.createElement("td");
			streetTd.innerText = `${voie} (${type_voie ? type_voie.toLowerCase() : ""})`;
			const cityTd = document.createElement("td");
			cityTd.innerText = commune;
			const typeTd = document.createElement("td");
			typeTd.innerText = type_local;
			const surfaceTd = document.createElement("td");
			surfaceTd.innerText = surface_relle_bati;
			const priceTd = document.createElement("td");
			priceTd.innerText = valeur_fonciere;
			const nbRoomTd = document.createElement("td");
			nbRoomTd.innerText = nombre_pieces_principales;

			tr.appendChild(dateTd);
			tr.appendChild(streetTd);
			tr.appendChild(cityTd);
			tr.appendChild(typeTd);
			tr.appendChild(surfaceTd);
			tr.appendChild(priceTd);
			tr.appendChild(nbRoomTd);

			tbody.appendChild(tr);
		}
	});

	tableResults.appendChild(tbody);
	$("#table-results").DataTable();
};

// Display first 100 properties in table
const displayTable = () => {
	// Create table headers
	createTableHeaders();

	// Create table body
	createTableBody();
};

// Event Listeners
submitBtn.addEventListener("click", async (e) => {
	e.preventDefault();

	// Reset propertiesArr
	propertiesArr = [];

	// Reset tableResults
	tableResults.innerHTML = `<table id="table-results"></table>`;

	// Fetch properties
	propertiesArr = await getProperties();
	propertiesArr.sort((a, b) => parseFloat(b.date_mutation) - parseFloat(a.date_mutation));

	// console.log(propertiesArr[0]);

	// Display number of results
	pResults.innerHTML = `
    Votre recherche a retournée <span class="count-results">${propertiesArr.length}</span> résultats
  `;

	// Display search criteria
	streetDetails.innerText = `${streetNb.value}, ${streetName.value}`;
	cityDetails.innerText = `${city.value}`;
	radiusDetails.innerText = `${radius.value ? radius.value : 200} metres`;

	// Reset form
	streetNb.value = "";
	streetName.value = "";
	radius.value = "";
	city.value = "";
});

downloadBtn.addEventListener("click", () => {
	downloadCSV();
});

displayBtn.addEventListener("click", () => {
	displayTable();
});
