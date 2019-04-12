# NODE rpi-led-rgb-matrix

*Il risultato finale in teoria dovrà essere un server che una volta eseguito permettera di accedere a due differenti pagine.*

Una da all'utente la possibilità di inserire il proprio testo, scegliere il colore, scegliere la luminosità e impostare la velocità con cui il testo verrà fatto scorrere per le 4 matrici di led collegate al Raspberry.


Invece l'altra pagina permette di inserire un immagine (attualmente solo in formato .jpg) e l'immagine verrà fatta scorrere per le 4 matrici di led collegate al Raspberry a velocità costante.


## Utilizzo

Il file index.js quando viene eseguito hosta in locale un [server](10.201.0.11:3000) che sarà adibito al testo.

Il file indexImage.js quando viene eseguito hosta in locale un [server](10.201.0.11:3000) che sarà adibito alle immagini.
