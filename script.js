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
const downloadBtn = document.getElementById("download-btn");

// Properties array
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
		`http://api.cquest.org/dvf?lat=${coords[0].lat}&lon=${coords[0]
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

// Event Listeners
submitBtn.addEventListener("click", async (e) => {
	e.preventDefault();

	// Fetch properties
	propertiesArr = await getProperties();
	console.log(propertiesArr[0]);

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
