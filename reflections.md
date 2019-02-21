the filtering system made us to reflect on some aspects.

1. flows: should we stress the miminum (certain) value, the maximum (potential) or the average among the two?
2. Filter nodes or edges?
3. if filtering nodes, what to do with small conduits?
4. Should we always show the total value of flows?

# Tasks

### 9 Jan

* ~~Aggiungere hover a flussi~~
* ~~Aggiugnere filtro su click~~
* ~~aggiungere ribbon selezione~~

### 7 feb

* ~~Aggiungere nuovo colore~~
* ~~filtrare link piccoli (<1% totale?)~~
* ~~Raggruppare nodi per paese~~

### 21 febbraio
* ~~Cambiare metodo di disegno dei gruppi~~
* ~~spostare gruppo al drag~~
* ~~Colorare nodi per tipologia~~
* Aggiornare link circolari dopo il drag
* Sistemare bug per cui il primo link non viene disegnato.
* Update stile grafico secondo mockup

# Misc

1. calcola il grafico
   1. crea nodi
   2. calcola colonne nodi in base a valore passato
   3. Crea links, legati agli oggetti nodo
   4. Crea gruppi, legati agli oggetti nodo e viceversa
2. Identifica link circolari (serve per calcolare padding totale)
3. definisci scala su dimensione verticale (step con totale più alto + link circolari + padding)
4. calcola dimensioni orizzontali totali (link in ingresso in colonna 0 + padding, link in uscita da ultima colonna + padding)
5. controlla sovrapposizioni
