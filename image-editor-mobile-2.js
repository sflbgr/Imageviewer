var filename, url, startX, startY, filenameLabel, wrapper, fileList, fileListIndex, nextButton, prevButton
var droparea, image, save, pos, height, width, natWidth, natHeight
var diffX, diffX, startX, startY, x, f, newTop, newLeft, mouseX, mouseY, fx, fy, ratio
var sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight, canvas, context, link, resize, deg
var cWidth, cHeight, eWidth, eHeight, df
var drawToCanvas, moveInCanvas, rotateInCanvas, zoomInCanvas, showFile
var outputText, copyButton, imageNumber

let clipboardContent = ""

let move = false, rotate = false, zoom = false
let gridVisible = true
let initialDistance = 0, initialAngle = 0
let currentScale = 1;
let currentRotation = 0;

// IndexedDB variables
let db;
const DB_NAME = 'ImageViewerDB';
const DB_VERSION = 1;
const IMAGES_STORE = 'images';
const INDEX_STORE = 'currentIndex';

function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Seitenverhältnis 20:9 (1080x2400)
// const svh = 20
// const svw = 9

// Seitenverhältnis 16:9 (720x1280)
//const svh = 16
//const svw = 9

// Seitenverhältnis 77:36 (1080x2310)
const svh = 77
const svw = 36
const headerHeight = 90


drawToCanvas = function() {
    deg = 0
    natWidth = image.naturalWidth
    natHeight = image.naturalHeight
    ratio = natWidth / natHeight
    sX = 0
    sY = 0
    sWidth = natWidth
    sHeight = natHeight
    // Canvas-Größe: immer doppelte Bildschirmgröße
    cWidth = (window.innerWidth * 4 < natWidth) ?  window.innerWidth * 4 : natWidth;
    cHeight = cWidth / svw * svh;
    canvas.width = cWidth;
    canvas.height = cHeight;

    // Bild so skalieren, dass es in den Canvas passt ("cover")
    let scale = cHeight / natHeight;
    dHeight = cHeight;
    dWidth = natWidth * scale;
    dX = (cWidth - dWidth) / 2;
    dY = 0;
    df = cHeight / eHeight
    context.clearRect(0, 0, cWidth, cHeight)
    context.save();
    context.translate(cWidth / 2, cHeight / 2);
    context.rotate(currentRotation * Math.PI / 180);
    context.scale(currentScale, currentScale);
    context.translate(-cWidth / 2, -cHeight / 2);
    context.drawImage(image, sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight);
    context.restore();
}

moveInCanvas = function(diffX, diffY) {
    // Verschiebung muss durch den aktuellen Zoomfaktor geteilt werden
    dX = dX + (diffX * df) / currentScale;
    dY = dY + (diffY * df) / currentScale;
    context.clearRect(0, 0, cWidth, cHeight)
    context.save();
    context.translate(cWidth / 2, cHeight / 2);
    context.rotate(currentRotation * Math.PI / 180);
    context.scale(currentScale, currentScale);
    context.translate(-cWidth / 2, -cHeight / 2);
    context.drawImage(image, sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight);
    context.restore();
}

zoomInCanvas = function(delta, eventPageX, eventPageY) {
    let x = 20;
    if (event && event.altKey) {
        x = 1;
    }
    if (event && event.shiftKey) {
        x = 100;
    }
    x *= df;
    // Use passed coordinates for touch, otherwise get from mouse event
    const rect = canvas.getBoundingClientRect();
    const pageX = eventPageX !== undefined ? eventPageX : event.pageX;
    const pageY = eventPageY !== undefined ? eventPageY : event.pageY;
    mouseX = (pageX - rect.left) * df;
    mouseY = (pageY - rect.top) * df;
    fx = (mouseX - dX) / dWidth;
    fy = (mouseY - dY) / dHeight;
    if (delta > 0) {
        dHeight = dHeight + x;
        diffX = (dHeight * ratio) - dWidth;
        dWidth = dHeight * ratio;
        dY = dY - (x * fy);
        dX = dX - (diffX * fx);
        currentScale *= 1.05;
    } else {
        dHeight = dHeight - x;
        diffX = dWidth - (dHeight * ratio);
        dWidth = dHeight * ratio;
        dY = dY + (x * fy);
        dX = dX + (diffX * fx);
        currentScale *= 0.95;
    }
    context.clearRect(0, 0, cWidth, cHeight);
    context.save();
    context.translate(cWidth / 2, cHeight / 2);
    context.rotate(currentRotation * Math.PI / 180);
    context.scale(currentScale, currentScale);
    context.translate(-cWidth / 2, -cHeight / 2);
    context.drawImage(image, sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight);
    context.restore();
}

rotateInCanvas = function(diffX, posY) {
    x = 0.25
    if (event.shiftKey) {
        x = 0.5
    }
    if (event.altKey) {
        x = 1
    }
    if (posY < eHeight/2) {
        deg = (diffX > 0) ? x : -x
    } else {
        deg = (diffX > 0) ? -x : x
    }
    currentRotation += deg;
    context.clearRect(0, 0, cWidth, cHeight)
    context.save();
    context.translate(cWidth / 2, cHeight / 2);
    context.rotate(currentRotation * Math.PI / 180);
    context.scale(currentScale, currentScale);
    context.translate(-cWidth / 2, -cHeight / 2);
    context.drawImage(image, sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight);
    context.restore();
}

showFile = function() {
    // Werte für Zoom, Drehung und Verschiebung zurücksetzen
    currentScale = 1;
    currentRotation = 0;
    dX = 0;
    dY = 0;
    
    if (fileListIndex >= 0 && fileListIndex < fileList.length) {
        filename = fileList[fileListIndex].name
        filenameLabel.innerHTML = filename
        
        if (url) {
            URL.revokeObjectURL(url)
            url = null
        }
        
        url = URL.createObjectURL(fileList[fileListIndex])
        image.addEventListener("load", function() {
            drawToCanvas();
        })
        image.src = url
        
        if (!gridVisible) {
            document.querySelectorAll(".line").forEach(el => el.classList.toggle("hidden"))
            gridVisible = !gridVisible
        }
        imageNumber.innerHTML = ((fileListIndex+1) + "/" + fileList.length)
        
        // Index in der Datenbank speichern
        saveCurrentIndex();
    }
    
}

clearCanvas = function() {
    
    drawToCanvas()
    context.clearRect(0, 0, cWidth, cHeight)
    
}

// IndexedDB functions
initDB = function() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Store für Bilder
            if (!db.objectStoreNames.contains(IMAGES_STORE)) {
                const imageStore = db.createObjectStore(IMAGES_STORE, { keyPath: 'id', autoIncrement: true });
                imageStore.createIndex('name', 'name', { unique: false });
            }
            
            // Store für aktuellen Index
            if (!db.objectStoreNames.contains(INDEX_STORE)) {
                db.createObjectStore(INDEX_STORE, { keyPath: 'id' });
            }
        };
    });
};

saveImagesToDB = async function(files) {
    if (!db) return;
    
    // Erst alle Dateien zu ArrayBuffer konvertieren (außerhalb der Transaktion)
    const imageDataArray = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const arrayBuffer = await file.arrayBuffer();
        
        imageDataArray.push({
            name: file.name,
            type: file.type,
            size: file.size,
            data: arrayBuffer,
            index: i
        });
    }
    
    // Dann in einer Transaktion speichern
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGES_STORE], 'readwrite');
        const store = transaction.objectStore(IMAGES_STORE);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        
        // Alle vorherigen Bilder löschen
        store.clear();
        
        // Neue Bilder hinzufügen
        imageDataArray.forEach(imageData => {
            store.add(imageData);
        });
    });
};

loadImagesFromDB = async function() {
    if (!db) return [];
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGES_STORE], 'readonly');
        const store = transaction.objectStore(IMAGES_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const imageData = request.result;
            // Nach Index sortieren
            imageData.sort((a, b) => a.index - b.index);
            
            // File-Objekte aus den gespeicherten Daten erstellen
            const files = imageData.map(data => {
                return new File([data.data], data.name, { type: data.type });
            });
            
            resolve(files);
        };
        
        request.onerror = () => reject(request.error);
    });
};

clearImagesFromDB = function() {
    if (!db) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGES_STORE], 'readwrite');
        const store = transaction.objectStore(IMAGES_STORE);
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

saveCurrentIndex = function() {
    if (!db || fileListIndex < 0) return;
    
    const transaction = db.transaction([INDEX_STORE], 'readwrite');
    const store = transaction.objectStore(INDEX_STORE);
    
    store.put({ id: 'current', index: fileListIndex });
};

loadCurrentIndex = function() {
    if (!db) return Promise.resolve(0);
    
    return new Promise((resolve) => {
        const transaction = db.transaction([INDEX_STORE], 'readonly');
        const store = transaction.objectStore(INDEX_STORE);
        const request = store.get('current');
        
        request.onsuccess = () => {
            const result = request.result;
            resolve(result ? result.index : 0);
        };
        
        request.onerror = () => resolve(0);
    });
};

clearCurrentIndex = function() {
    if (!db) return;
    
    const transaction = db.transaction([INDEX_STORE], 'readwrite');
    const store = transaction.objectStore(INDEX_STORE);
    store.clear();
};

document.addEventListener("DOMContentLoaded", async function() {
    
    droparea = document.querySelector("#droparea")
    image = document.querySelector("#my_image")
    filenameLabel = document.querySelector("#filename")
    wrapper = document.querySelector("#wrapper")
    nextButton = document.querySelector("#next-button")
    prevButton = document.querySelector("#prev-button")
    // outputText = document.querySelector("#output-text")
    // copyButton = document.querySelector("#copy-filenames")
    imageNumber = document.querySelector("#image-number")
    nextImageWrapper = document.querySelector("#next-image-wrapper")
    
    // IndexedDB initialisieren
    try {
        await initDB();
        
        // Gespeicherte Bilder laden
        const savedImages = await loadImagesFromDB();
        if (savedImages.length > 0) {
            fileList = savedImages;
            fileListIndex = await loadCurrentIndex();
            
            // Sicherstellen, dass der Index im gültigen Bereich liegt
            if (fileListIndex >= savedImages.length) {
                fileListIndex = 0;
            }
            
            showFile();
        }
    } catch (error) {
        console.error('Fehler beim Initialisieren der IndexedDB:', error);
    }

    const fileSelectButton = document.querySelector('#file-select-button');
    const fileInput = document.querySelector('#file-input');
    const fullscreenButton = document.querySelector('#fullscreen-button');
    const saveButton = document.querySelector('#save-button');

    fileSelectButton.addEventListener('click', function() {
        fileInput.click();
    });

    fullscreenButton.addEventListener('click', function() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    });

    fileInput.addEventListener('change', async function(event) {
        if (event.target.files.length > 0) {
            fileList = event.target.files;
            fileListIndex = 0;
            
            // Neue Bilder in der Datenbank speichern
            try {
                await saveImagesToDB(fileList);
                clearCurrentIndex(); // Index zurücksetzen
            } catch (error) {
                console.error('Fehler beim Speichern der Bilder:', error);
            }
            
            showFile();
        }
    });

    canvas = document.querySelector("#edit-canvas")
    context = canvas.getContext("2d")
    
    resize = function() {
        
        eWidth = droparea.clientWidth
        eHeight = eWidth / svw * svh
        
        const elementsToResize = document.querySelectorAll("#wrapper, #background, #edit-canvas");
        elementsToResize.forEach(el => {
            el.style.height = eHeight + "px";
            el.style.width = eWidth + "px";
        });

        document.querySelector("#line-vert-1").style.left = eWidth / 3 + "px";
        document.querySelector("#line-vert-2").style.left = eWidth / 2 + "px";
        document.querySelector("#line-vert-3").style.left = (eWidth / 3) * 2 + "px";
        document.querySelector("#line-horz-1").style.top = eHeight / 3 + "px";
        document.querySelector("#line-horz-2").style.top = (eHeight / 3) * 2 + "px";
    }
    window.addEventListener("resize", resize)
    resize()
    
    window.addEventListener("contextmenu", function(event) {
        event.preventDefault()
        return false
    })
    
    droparea.addEventListener("drop", function(event) {
        if (!move) {
            event.preventDefault()
            event.stopPropagation()
            
            // Canvas-Größe: doppelte Bildschirmgröße
            cWidth = window.innerWidth * 2;
            cHeight = window.innerHeight * 2;
            canvas.width = cWidth;
            canvas.height = cHeight;

            // Bild so skalieren, dass es in den Canvas passt ("cover"-Logik)
            let scale = Math.min(cWidth / natWidth, cHeight / natHeight);
            let drawWidth = natWidth * scale;
            let drawHeight = natHeight * scale;
            let offsetX = (cWidth - drawWidth) / 2 + dX;
            let offsetY = (cHeight - drawHeight) / 2 + dY;
            
            showFile()
            
            return false
        }
    })
    droparea.addEventListener("dragover", function(event) {
        if (!move) {
            event.preventDefault()
            event.stopPropagation()
        }
    })
    droparea.addEventListener("dragleave", function(event) {
        if (!move) {
            event.preventDefault()
            event.stopPropagation()
        }
    })
    droparea.addEventListener("dragend", function(event) {
        if (!move) {
            event.preventDefault()
            event.stopPropagation()
        }
    })
    
    document.body.addEventListener("mousedown", function(event) {
        event.preventDefault()
        event.stopPropagation()
        startX = event.pageX
        startY = event.pageY
        if (event.which === 1) {
            move = true
        } else if (event.which === 3) {
            rotate = true
        }
    });
    document.body.addEventListener("mousemove", function(event) {
        event.preventDefault()
        event.stopPropagation()
        diffX = event.pageX - startX
        diffY = event.pageY - startY
        startX = event.pageX
        startY = event.pageY
        if (move) {
            moveInCanvas(diffX, diffY)
        } else if (rotate) {
            rotateInCanvas(diffX, event.pageY)
        }
    });
    document.body.addEventListener("mouseup", function(event) {
        event.preventDefault()
        event.stopPropagation()
        move = false
        rotate = false
    });
    document.body.addEventListener("wheel", function(event) {
        zoomInCanvas(event.deltaY < 0 ? 1 : -1, event.pageX, event.pageY);
    });
    
    // Touch Events
    document.body.addEventListener("touchstart", function(event) {
        if (event.target.tagName === 'BUTTON') {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const touches = event.touches;
        if (touches.length === 1) {
            move = true;
            startX = touches[0].pageX;
            startY = touches[0].pageY;
        } else if (touches.length === 2) {
            zoom = true;
            rotate = true;
            initialDistance = getDistance(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY);
            initialAngle = getAngle(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY);
        }
    }, { passive: false });

    document.body.addEventListener("touchmove", function(event) {
        event.preventDefault();
        event.stopPropagation();
        const touches = event.touches;
        if (move && touches.length === 1) {
            const diffX = touches[0].pageX - startX;
            const diffY = touches[0].pageY - startY;
            startX = touches[0].pageX;
            startY = touches[0].pageY;
            moveInCanvas(diffX, diffY);
        } else if ((zoom || rotate) && touches.length === 2) {
            const currentDistance = getDistance(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY);
            const zoomFactor = currentDistance / initialDistance;
            currentScale *= zoomFactor;
            initialDistance = currentDistance;
            const currentAngle = getAngle(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY);
            const angleDiff = currentAngle - initialAngle;
            currentRotation += angleDiff;
            initialAngle = currentAngle;
            context.clearRect(0, 0, cWidth, cHeight);
            context.save();
            context.translate(cWidth / 2, cHeight / 2);
            context.rotate(currentRotation * Math.PI / 180);
            context.scale(currentScale, currentScale);
            context.translate(-cWidth / 2, -cHeight / 2);
            context.drawImage(image, sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight);
            context.restore();
        }
    }, { passive: false });

    document.body.addEventListener("touchend", function(event) {
        if (event.target.tagName === 'BUTTON') {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        move = false;
        rotate = false;
        zoom = false;
        initialDistance = 0;
        initialAngle = 0;
    });

    var saveClick = function() {
        // --- Logik zur Bildskalierung ---

        // 1. Legen Sie hier die gewünschte Breite für das heruntergeladene Bild fest.
        const downloadWidth = 1080;

        // 2. Erstellen Sie ein temporäres Canvas-Element.
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // 3. Berechnen Sie die Höhe basierend auf dem Seitenverhältnis des sichtbaren Bereichs.
        const aspectRatio = canvas.width / canvas.height;
        const downloadHeight = Math.floor(downloadWidth / aspectRatio) + 90;

        // 4. Stellen Sie die Größe des temporären Canvas ein.
        tempCanvas.width = downloadWidth;
        tempCanvas.height = downloadHeight;
        
        // 5. Zeichnen Sie den Inhalt des Haupt-Canvas auf das temporäre Canvas.
        //    Dadurch wird das Bild auf die neue Größe skaliert.
        tempCtx.drawImage(canvas, 0, 90, downloadWidth, downloadHeight);

        // 6. Starten Sie den Download vom temporären Canvas.
        const link = document.createElement("a");
        link.download = filename;
        
        tempCanvas.toBlob(function(blob) {
            link.href = URL.createObjectURL(blob);
            link.click();
            filenameLabel.innerHTML = filename + " (saved)";
        }, "image/jpeg", 0.95);
    }
    
    saveButton.addEventListener('click', saveClick);
    
    nextButton.addEventListener("click", function() {
        fileListIndex++
        showFile()
    })
    prevButton.addEventListener("click", function() {
        fileListIndex--
        showFile()
    })
    
    document.body.addEventListener("keydown", function(event) {
        // if (event.key == "c") {
        //     if (outputText.value.indexOf(filename) === -1) {
        //         outputText.value += filename + "\n"
        //         clipboardContent += filename + "\n"
        //         navigator.clipboard.writeText(clipboardContent)
        //         //outputText.select()
        //         //document.execCommand("copy")
        //         //outputText.value = ""
        //     }
        // }
        // if (event.key == "x") {
        //     outputText.value = ""
        //     clipboardContent = ""
        //     navigator.clipboard.writeText("")
        // }
        if (event.key == "s") {
            saveClick()
        }
        if (event.key == "ArrowRight" || 
            event.key == "d") {
            fileListIndex++
            showFile()
        }
        if (event.key == "ArrowLeft" ||
            event.key == "a") {
            fileListIndex--
            showFile()
        }
        if (event.key == "q") {
            document.querySelectorAll(".line").forEach(el => el.classList.toggle("hidden"))
            gridVisible = !gridVisible
        }
        if (event.key == "Escape" || 
            event.key == "Delete") {
            event.preventDefault()
            event.stopPropagation()
            location.reload()
        }
    })
    
    // copyButton.addEventListener("click", function() {
    //     outputText.select()
    //     document.execCommand("copy")
    //     outputText.value = ""
    // })
})
