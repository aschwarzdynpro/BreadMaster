# BreadMaster

Eine kleine statische Web App, die bei Angabe verschiedener Mehlmengen
(Weizen, Dinkel, Roggen – jeweils Type 550 und Vollkorn) die empfohlene
Wassermenge und Hefemenge für das perfekte Brot berechnet. Über einen
Zeit-Regler lässt sich die Dauer der Stockgare einstellen – die Hefemenge
wird automatisch entsprechend angepasst.

## Lokal ausführen

Einfach `index.html` im Browser öffnen – es werden keine Abhängigkeiten
benötigt.

## Auf GitHub Pages hosten

1. Repository auf GitHub pushen.
2. In den Repository-Einstellungen unter **Settings → Pages** die Quelle auf
   den gewünschten Branch (z. B. `main`) und den Ordner `/ (root)` setzen.
3. Nach wenigen Sekunden ist die App unter
   `https://<nutzer>.github.io/<repo>/` erreichbar.

## Berechnungsgrundlagen

Hydration (Wasser in % des jeweiligen Mehlgewichts):

| Mehl              | Hydration |
| ----------------- | --------- |
| Weizen Type 550   | 65 %      |
| Weizen Vollkorn   | 75 %      |
| Dinkel Type 550   | 60 %      |
| Dinkel Vollkorn   | 70 %      |
| Roggen Type 1150  | 75 %      |
| Roggen Vollkorn   | 85 %      |

Die Gesamt-Wassermenge ergibt sich aus der Summe der gewichteten Einzelwerte.

Hefe (Frischhefe, Faustformel): `Hefe % ≈ 2 / Stockgarezeit (h)`.
Trockenhefe entspricht etwa einem Drittel der Frischhefemenge.
Salz: 2 % der gesamten Mehlmenge.
