/*
    Autore: Michele Della Mea
*/


var express = require('express'); //framework che sta alla base
var path = require('path'); //lo uso per i percorsi
var bodyParser = require('body-parser'); //lo uso per leggere il testo
var fs = require('fs'); // lo uso per leggere i file
var fileUpload = require('express-fileupload'); // lo uso per leggere i file dal sito
const child = require('child_process') // lo uso per i processi figli
var jsonfile = require('jsonfile');
var app = express();


/*
---------------------------------------------------------Inizializzazione variabili etc.---------------------------------------------------------
*/

var port = process.env.PORT || 80; //uso la porta 80 cos� che io possa scrivere direttamente 10.201.0.11 senza la porta

app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'ejs'); //cartella dei file html da inviare al sito
app.use(express.static(path.join(__dirname, 'public'))); //le risorse usate dal sito


app.use('/image', fileUpload());
app.use('/text', bodyParser.json());
app.use('/text', bodyParser.urlencoded({ extended: true }));
app.use('/dataImage', bodyParser.json());
app.use('/dataImage', bodyParser.urlencoded({ extended: true }));
app.use('/delete', bodyParser.json());
app.use('/delete', bodyParser.urlencoded({ extended: true }));



var childSub;
//riavvio l'ultimo processo che � stato avviato 
var resumeLastMatrix = fs.readFileSync('dataSub/lastMatrix.txt');
var actualMatrix = parseInt(resumeLastMatrix, 10); // converto da stringa a carattere
switch (actualMatrix) {
	case 1: // 1 = immagine
		childSub = child.fork('dataSub/subIndexImage.js');
		break;
	case 2: // 2 = testo
		childSub = child.fork('dataSub/subIndexText.js');
		break;
	default: //non dovrebbe accadere mai spero
		
		childSub = child.fork('dataSub/subIndexText.js'); //faccio ripartire questo senno da errore quando chiamo i post per la prima volta
		break;
}

var actualImage = require('./dataImage.json');
//console.log(actualImage);
var metaBase64 = "data:image/png;base64,";

/*
---------------------------------------------------------Fine Inizializzazione---------------------------------------------------------
*/



/*

	+ Gestione delle richeste da /delete

*/

app.post('/delete', function(req, res){
	toDelete = req.body.action; //ottengo il nome dell' immagine da cancellare
	console.log(toDelete, req.body);
	for(var i = 0; i< actualImage.length; i++){
		if(actualImage[i].name == toDelete){ //trovato cosa cancellare
			
			actualImage = arrayRemove(actualImage, actualImage[i]);//cancello nell' array
			
			const removeImageFromFolder = child.spawnSync('sudo', ['rm', './img/input' + i + '.jpg'], {}); //cancello effetivamente il file
			break;
		}
	}
	saveJson();
	res.redirect('/dataImage');


})

/*
	Gestione delle richieste da /image
*/

app.get('/dataImage', function(req, res){
	//console.log(actualImage);
	res.render('indexImageData', {imageList: actualImage});
})

app.post('/dataImage', function(req, res){
	var speed = req.body.speedImage;
	var brig = req.body.brigImage;
	var data = speed.concat('Ĭ'+brig);
	fs.writeFileSync('dataSub/dataInImage.txt', data, {});
	res.redirect('/image');
});


app.get('/image', function (req, res) { 
	res.render('indexImage', {});
})


app.post('/image', function (req, res) { 
	
	childSub.kill('SIGKILL', {});

	// la rimozione delle vecchie immagini � fondamentale
	var i = 0
	var fileToRemove = fs.readFileSync('dataSub/numberOfFile.txt', {}); //questo file DEVE esistere NON VA CANCELLATO o non funziona
	
	while(fileToRemove > i){ // questo perche child process fa schifo e non mi lascia fare sudo rm ./img/*.jpg
		const removeImageFromFolder = child.spawnSync('sudo', ['rm', './img/input' + i + '.jpg'], {}); //cancello tutti i file immagine da dalla cartella
		/* 
		==> Per un eventuale debug


		removeImageFromFolder.stdout.on('data', (data) => {
			console.log(data.toString('utf8'));
		});
		
		removeImageFromFolder.stderr.on('data', (data) => {
			
			console.log(data.toString('utf8'));
		});
		removeImageFromFolder.on('close', (code)=>{
			console.log(code);
		});

		*/


		i++;
	}
	
	let file = req.files.imageToDisplay;//array di oggetti contenente tutti i file

	//console.log(file);

	var numImg = 0;

	actualImage = []; // svuoto l'array

	//console.log(actualImage, actualImage[0]);
	if(file.length > 0){ //capisco se ci� che carico � un array di file o solo un singolo file
		for(var i = 0; i<(file.length); i++){ 
			actualImage[i] = new Object(); //inizializzo l'oggetto
			actualImage[i].imgSrc = metaBase64.concat(file[i].data.toString('base64')); //converto il buffer dell immagine in base64 e gli aggiungo i metadati

			//console.log(file[i].data);
			//console.log(file[i].data.toString('base64'));

			file[i].mv('img/input' + i +'.jpg', function(err) { //inserisco nel filesystem le immaggini
				if (err) return res.send(err);
			});
			actualImage[i].name = 'img/input' + i +'.jpg';
			numImg = file.length;
		}
	} else {
		actualImage[0] = new Object();
		actualImage[0].imgSrc = metaBase64.concat(file.data.toString('base64')); //converto il buffer dell immagine in base64 e gli aggiungo i metadati

		file.mv('img/input' + 0 +'.jpg', function(err) { //inserisco nel filesystem l'immagine
			if (err) return res.send(err);
		});
		actualImage[0].name = 'img/input' + i +'.jpg';
		numImg = 1;
		
	}
	saveJson();
	//salvo il numero di file in modo tale da poterli eliminare al prossimo caricamento
	fs.writeFileSync('dataSub/numberOfFile.txt', numImg, {});
	
	childSub = child.fork('dataSub/subIndexImage.js', {});
	fs.writeFile('dataSub/lastMatrix.txt', 1, {});

	res.render('indexImage', {});
});

/*
	Gestione delle richieste da /text
*/

app.get('/text', function (req, res) { 
	res.render('indexText', {});
})


app.post('/text', function (req, res) {
	
	childSub.kill('SIGKILL'); //INVIA IL SEGNALE DI CHIUSRA
	
	
	
	const item = req.body.userSearchInput;

	const s = req.body.speed;
	
	const brig = req.body.userSearchBright;
	
	const color = req.body.userSearchColor;
	const r = hexToRgb(color).r;
	const g = hexToRgb(color).g;
	const b = hexToRgb(color).b;
	
	/*
		-> I � carattere UNICODE realizzato con alt+300 il quale viene usato come divisore
		-> Unisco tutto in un unica stringa che poi scriver� sul file
	*/
	
	fs.writeFile('dataSub/dataInText.txt', item.concat('I'+r+'I'+g+'I'+b+'I'+brig+'I'+s), (err)=>{
		if (err) throw err;
	}); 
	
	
	
	childSub = child.fork('dataSub/subIndexText.js');
	fs.writeFile('dataSub/lastMatrix.txt', 2, {});

	
	res.render('indexText', {});
});



app.get('/', function(req,res){ //pagina di base
	res.render('index', {});
});



app.listen(port, function(){

	console.log(`Server IP: 10.201.0.11`);
});



function hexToRgb(hex) {
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		return r + r + g + g + b + b;
	});

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function arrayRemove(arr, value) {
	
	console.log(arr, value);
	return arr.filter(function(ele){
	    return ele != value;
	});

}

function saveJson() {
	
	let data = JSON.stringify(actualImage, null, 2);
	fs.writeFile('dataImage.json', data);

}