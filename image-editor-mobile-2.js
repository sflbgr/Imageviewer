var filename, url, startX, startY, filenameLabel, wrapper, fileList, fileListIndex, nextButton, prevButton
var droparea, image, save, pos, height, width, natWidth, natHeight
var diffX, diffX, startX, startY, x, f, newTop, newLeft, mouseX, mouseY, fx, fy, ratio
var sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight, canvas, context, link, resize, deg
var cWidth, cHeight, eWidth, eHeight, df
var drawToCanvas, moveInCanvas, rotateInCanvas, zoomInCanvas, showFile
var outputText, copyButton, imageNumber

let clipboardContent = ""

let move = false, rotate = false
let gridVisible = true

drawToCanvas = function() {
    
    deg = 0
    
    natWidth = image[0].naturalWidth
    natHeight = image[0].naturalHeight
    
    ratio = natWidth / natHeight
    
    sX = 0
    sY = 0
    sWidth = natWidth
    sHeight = natHeight
    
    if ( (natWidth / natHeight) < (16 / 9) ) {
        cHeight = natHeight
        cWidth = cHeight / 16 * 9
        dX = -((natWidth - cWidth) / 2)
        dY = 0
        dWidth = sWidth
        dHeight = sHeight
    } else {
        cWidth = natWidth
        cHeight = cWidth / 9 * 16
        dX = 0
        dY = -((natHeight - cHeight) / 2)
        dWidth = sWidth
        dHeight = sHeight
    }
    
    canvas[0].width = cWidth
    canvas[0].height = cHeight
    
    df = cHeight / eHeight
    
    context.clearRect(0, 0, cWidth, cHeight)
    context.drawImage(image[0], sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight)
    
}

moveInCanvas = function(diffX, diffY) {
    
    dX = dX + (diffX * df)
    dY = dY + (diffY * df)
    
    context.clearRect(0, 0, cWidth, cHeight)
    context.drawImage(image[0], sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight)
    
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
    
    mouseX = (event.pageX - canvas.offset().left) * df
    mouseY = (event.pageY - canvas.offset().top) * df

    fx = (mouseX - dX) / dWidth
    fy = (mouseY - dY) / dHeight
    
    if (event.originalEvent.wheelDelta > 0) {
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
    context.drawImage(image[0], sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight)
    
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
    context.drawImage(image[0], sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight)
    
}

showFile = function() {
    
    if (fileListIndex >= 0 && fileListIndex < fileList.length) {
        filename = fileList[fileListIndex].name
        filenameLabel.html(filename)
        
        if (url) {
            URL.revokeObjectURL(url)
            url = null
        }
        
        url = URL.createObjectURL(fileList[fileListIndex])
        image.on("load", function() {
            drawToCanvas()
        })
        image.attr("src", url)
        
        if (!gridVisible) {
            jQuery(".line").toggle("hidden")
            gridVisible = !gridVisible
        }
        imageNumber.html((fileListIndex+1) + "/" + fileList.length)
    }
    
}

clearCanvas = function() {
    
    drawToCanvas()
    context.clearRect(0, 0, cWidth, cHeight)
    
}

document.addEventListener("DOMContentLoaded", function() {
    
    droparea = jQuery("#droparea")
    image = jQuery("#my_image")
    save = jQuery("#save")
    filenameLabel = jQuery("#filename")
    wrapper = jQuery("#wrapper")
    nextButton = jQuery("#next-button")
    prevButton = jQuery("#prev-button")
    outputText = jQuery("#output-text")
    copyButton = jQuery("#copy-filenames")
    imageNumber = jQuery("#image-number")
    nextImageWrapper = jQuery("#next-image-wrapper")

    canvas = jQuery("#edit-canvas")
    context = canvas[0].getContext("2d")
    
    resize = function() {
        eHeight = droparea.height()
        eWidth = eHeight / 16 * 9
        jQuery("#wrapper, #background, #edit-canvas").css({
            height: eHeight + "px",
            width: eWidth + "px"
        })
        jQuery("#line-vert-1").css({
            left: eWidth / 3
        })
        jQuery("#line-vert-2").css({
            left: eWidth / 2
        })
        jQuery("#line-vert-3").css({
            left: eWidth / 3 * 2
        })
        jQuery("#line-horz-1").css({
            top: eHeight / 3
        })
        jQuery("#line-horz-2").css({
            top: eHeight / 3 * 2
        })
    }
    jQuery(window).on("resize", function() {
        resize()
    })
    resize()
    
    jQuery(window).on("contextmenu", function() {
        return false
    })
    
    droparea.on("drop dragend", function(event) {
        if (!move) {
            event.preventDefault()
            event.stopPropagation()
            
            console.log(event.originalEvent.dataTransfer)
            
            fileList = event.originalEvent.dataTransfer.files
            fileListIndex = 0
            
            showFile()
            
            return false
            
            
        }
    }).on("dragover", function(event) {
        if (!move) {
            event.preventDefault()
            event.stopPropagation()
        }
    }).on("dragleave dragend", function(event) {
        if (!move) {
            event.preventDefault()
            event.stopPropagation()
        }
    })
    
    jQuery("body").on("mousedown", function(event) {
        event.preventDefault()
        event.stopPropagation()
        startX = event.pageX
        startY = event.pageY
        if (event.which === 1) {
            move = true
        } else if (event.which === 3) {
            rotate = true
        }
    }).on("mousemove", function(event) {
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
    }).on("mouseup", function(event) {
        event.preventDefault()
        event.stopPropagation()
        move = false
        rotate = false
    }).on("mousewheel", function(event) {
        zoomInCanvas(event)
    })
    
    var saveClick = function() {
        link = document.createElement("a")
        link.download = filename
        
        canvas[0].toBlob(function(blob) {
            link.href = URL.createObjectURL(blob)
            link.click()
            filenameLabel.html(filename + " (saved)")
        }, "image/jpeg", 0.95)
    }
    
    save.on("click", saveClick)
    
    nextButton.on("click", function() {
        fileListIndex++
        showFile()
    })
    prevButton.on("click", function() {
        fileListIndex--
        showFile()
    })
    
    jQuery("body").on("keydown", function(event) {
        if (event.originalEvent.key == "c") {
            if (outputText.val().indexOf(filename) === -1) {
                outputText.append(filename + "\n")
                clipboardContent += filename + "\n"
                navigator.clipboard.writeText(clipboardContent)
                //outputText[0].select()
                //document.execCommand("copy")
                //outputText.empty()
            }
        }
        if (event.originalEvent.key == "x") {
            outputText.empty()
            clipboardContent = ""
            navigator.clipboard.writeText("")
        }
        if (event.originalEvent.key == "s") {
            saveClick()
        }
        if (event.originalEvent.key == "ArrowRight" || 
            event.originalEvent.key == "d") {
            fileListIndex++
            showFile()
        }
        if (event.originalEvent.key == "ArrowLeft" ||
            event.originalEvent.key == "a") {
            fileListIndex--
            showFile()
        }
        if (event.originalEvent.key == "q") {
            jQuery(".line").toggle("hidden")
            gridVisible = !gridVisible
        }
        if (event.originalEvent.key == "Escape" || 
            event.originalEvent.key == "Delete") {
            event.preventDefault()
            event.stopPropagation()
            location.reload()
        }
    })
    
    copyButton.on("click", function() {
        outputText[0].select()
        document.execCommand("copy")
        outputText.empty()
    })
})
