var filename, url, startX, startY, filenameLabel, wrapper, fileList, fileListIndex, nextButton, prevButton
var droparea, image, save, pos, height, width, natWidth, natHeight
var diffX, startX, startY, x, f, newTop, newLeft, mouseX, mouseY, fx, fy, ratio
var sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight, canvas, context, link, resize, deg
var cWidth, cHeight, eWidth, eHeight, df
var drawToCanvas, moveInCanvas, rotateInCanvas, zoomInCanvas, showFile
var outputText, copyButton, imageNumber

let clipboardContent = ""

let move = false, rotate = false
let gridVisible = true

// Seitenverhältnis 20:9 (1080x2400)
//const svh = 20
//const svw = 9

// Seitenverhältnis 16:9 (720x1280)
//const svh = 16
//const svw = 9

// Seitenverhältnis 77:36 (1080x2310)
const svh = 77
const svw = 36



drawToCanvas = function() {
    
    deg = 0
    
    natWidth = image.naturalWidth
    natHeight = image.naturalHeight
    
    ratio = natWidth / natHeight
    
    sX = 0
    sY = 0
    sWidth = natWidth
    sHeight = natHeight
    
    if ( (natWidth / natHeight) < (svh / svw) ) {
        cHeight = natHeight
        cWidth = cHeight / svh * svw
        dX = -((natWidth - cWidth) / 2)
        dY = 0
        dWidth = sWidth
        dHeight = sHeight
    } else {
        cWidth = natWidth
        cHeight = cWidth / svw * svh
        dX = 0
        dY = -((natHeight - cHeight) / 2)
        dWidth = sWidth
        dHeight = sHeight
    }
    
    canvas.width = cWidth
    canvas.height = cHeight
    
    df = cHeight / eHeight
    
    context.clearRect(0, 0, cWidth, cHeight)
    context.drawImage(image, sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight)
    
}

moveInCanvas = function(diffX, diffY) {
    
	if (cWidth != dWidth) {
		dX = dX + (diffX * df)
	}
    if (cHeight != dHeight) {
		dY = dY + (diffY * df)
	}
	
    context.clearRect(0, 0, cWidth, cHeight)
    context.drawImage(image, sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight)
    
}

zoomInCanvas = function(event) {
    
    x = 20
    if (event.altKey) {
        x = 1
    }
    if (event.shiftKey) {
        x = 100
    }
    x *= df
    
    const rect = canvas.getBoundingClientRect();
    mouseX = (event.pageX - rect.left) * df;
    mouseY = (event.pageY - rect.top) * df;

    fx = (mouseX - dX) / dWidth
    fy = (mouseY - dY) / dHeight
    
    if (event.wheelDelta > 0) {
        dHeight = dHeight + x
        diffX = (dHeight * ratio) - dWidth
        dWidth = dHeight * ratio
        dY = dY - (x * fy)
        dX = dX - (diffX * fx)
    } else {
        dHeight = dHeight - x
        diffX = dWidth - (dHeight * ratio)
        dWidth = dHeight * ratio
        dY = dY + (x * fy)
        dX = dX + (diffX * fx)
    }
    
    context.clearRect(0, 0, cWidth, cHeight)
    context.drawImage(image, sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight)
    
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
    
    context.translate(cWidth / 2, cHeight / 2)
    context.rotate(deg * Math.PI / 180)
    context.translate(-(cWidth / 2), -(cHeight / 2))
    
    context.clearRect(0, 0, cWidth, cHeight)
    context.drawImage(image, sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight)
    
}

showFile = function() {
    
    if (fileListIndex >= 0 && fileListIndex < fileList.length) {
        filename = fileList[fileListIndex].name
        filenameLabel.innerHTML = filename
        
        if (url) {
            URL.revokeObjectURL(url)
            url = null
        }
        
        url = URL.createObjectURL(fileList[fileListIndex])
        image.addEventListener("load", function() {
            drawToCanvas()
        })
        image.src = url
        
        if (!gridVisible) {
            document.querySelectorAll(".line").forEach(el => el.classList.toggle("hidden"));
            gridVisible = !gridVisible
        }
        imageNumber.innerHTML = ((fileListIndex+1) + "/" + fileList.length)
    }
    
}

clearCanvas = function() {
    
    drawToCanvas()
    context.clearRect(0, 0, cWidth, cHeight)
    
}

document.addEventListener("DOMContentLoaded", function() {
    
    droparea = document.querySelector("#droparea")
    image = document.querySelector("#my_image")
    save = document.querySelector("#save")
    filenameLabel = document.querySelector("#filename")
    wrapper = document.querySelector("#wrapper")
    nextButton = document.querySelector("#next-button")
    prevButton = document.querySelector("#prev-button")
    // outputText = document.querySelector("#output-text")
    // copyButton = document.querySelector("#copy-filenames")
    imageNumber = document.querySelector("#image-number")
    // nextImageWrapper = document.querySelector("#next-image-wrapper")

    canvas = document.querySelector("#edit-canvas")
    context = canvas.getContext("2d")
    
    resize = function() {
        eHeight = droparea.clientHeight
        eWidth = eHeight / svh * svw
        
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
    window.addEventListener("resize", resize);
    resize()
    
    window.addEventListener("contextmenu", function(event) {
        event.preventDefault();
        return false
    })
    
    droparea.addEventListener("drop", function(event) {
        if (!move) {
            event.preventDefault()
            event.stopPropagation()
            
            fileList = event.dataTransfer.files
            fileListIndex = 0
            
            showFile()
            
            return false
        }
    });
    droparea.addEventListener("dragend", function(event) {
        if (!move) {
            event.preventDefault()
            event.stopPropagation()
        }
    });
    droparea.addEventListener("dragover", function(event) {
        if (!move) {
            event.preventDefault()
            event.stopPropagation()
        }
    });
    droparea.addEventListener("dragleave", function(event) {
        if (!move) {
            event.preventDefault()
            event.stopPropagation()
        }
    });
    
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
        zoomInCanvas(event)
    });
    
    var saveClick = function() {
        link = document.createElement("a")
        link.download = filename
        
        canvas.toBlob(function(blob) {
            link.href = URL.createObjectURL(blob)
            link.click()
            filenameLabel.innerHTML = filename + " (saved)"
        }, "image/jpeg", 0.95)
    }
    
    save.addEventListener("click", saveClick)
    
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
            document.querySelectorAll(".line").forEach(el => el.classList.toggle("hidden"));
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
