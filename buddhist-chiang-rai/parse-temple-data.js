//Converts the CSV file to JSON

const fs = require('fs')
const parse = require('csv-parse/lib/sync');
const input = fs.readFileSync('Buddhist-Chiang-Rai.csv','utf8');
const strip = function(s) {return s.replace(/^\s+/,'').replace(/\s+$/,'');};
const records = parse(input, {columns: true,skip_empty_lines: true}).map(function(itm){
	var rec = {
		"﻿Temple Name (English)":strip(itm["﻿Temple Name (English)"]), //: "Wat Pang Lao",
		"Temple Name (Thai)":strip(itm["Temple Name (Thai)"]), //: "ปางลาว ",
		"Latitude":parseFloat(itm["Latitude"]), //: "19.9647",
		"Longitude":parseFloat(itm["Longitude"]), //: "99.8633",
		"Ruins?":strip(itm["Ruins?"]).toUpperCase(), //: "N",
		"Tambon":strip(itm["Tambon"]), //: "Ban Du",
		"Sect":strip(itm["Sect"]).toUpperCase(), //: "M",
		"Year Established (BE)":parseInt(itm["Year Established (BE)"]), //: "2450",
		"Year Established (CE)":parseInt(itm["Year Established (CE)"]), //: "1907",
		"visuṃgāmasīmā Year (BE)":parseInt(itm["visuṃgāmasīmā Year (BE)"]), //: "2513",
		"visuṃgāmasīmā Year (CE)":parseInt(itm["visuṃgāmasīmā Year (CE)"]), //: "1970",
		"Vihan/Bot Combo?":strip(itm["Vihan/Bot Combo?"]).toUpperCase(), //: "Y",
		"Women in Bot?":strip(itm["Women in Bot?"]).toUpperCase(), //: "Y",
		"Khrop Cedi?":strip(itm["Khrop Cedi?"]).toUpperCase(), //: "N",
		" Visions?":strip(itm[" Visions?"]).toUpperCase(), //: "U",
		"Reported Vision":strip(itm["Reported Vision"]).toUpperCase(), //: "",
		"Old Manuscripts?":strip(itm["Old Manuscripts?"]).toUpperCase(), //: "Y",
		"Sala Khaek Pannya?":strip(itm["Sala Khaek Pannya?"]).toUpperCase(), //: "Y",
		"Phra Achan Phop Chok?":strip(itm["Phra Achan Phop Chok?"]).toUpperCase(), //: "N",
		"Phra Achan Wibun":strip(itm["Phra Achan Wibun"]).toUpperCase() //: "U",
	}
	return rec;
});
//records.sort(function(a,b){return a["Year Established (BE)"]-b["Year Established (BE)"]; })
var out = '//DATA GATHERED BY ANTHONY IRWIN!  IT TOOK HIM YEARS!\n';
out = out + 'var temples=' + JSON.stringify(records,null,2);
out = out.replace(/[\u200B-\u200D\uFEFF]/g, '');
fs.writeFileSync('temples.js',out,'utf8');