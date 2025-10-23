var filename, url, startX, startY, filenameLabel, wrapper, fileList, fileListIndex, nextButton, prevButton
var droparea, image, save, pos, height, width, natWidth, natHeight
var diffX, diffX, startX, startY, x, f, newTop, newLeft, mouseX, mouseY, fx, fy, ratio
var sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight, canvas, context, link, resize, deg, draw, drawOffsetX, drawOffsetY
var cWidth, cHeight, eWidth, eHeight, df, px
var drawToCanvas, moveInCanvas, rotateInCanvas, zoomInCanvas, showFile, moveFrame, frameMoving, frameMoved, frameWidth
var x1, xWidth, x2

let move = false, rotate = false
let gridVisible = true
let degree = 0
let frame = false, drawFrame = false, frameOffsetX = 0

let taskbarHeight = 40

drawToCanvas = function() {
    
    degree = 0
    
    natWidth = image[0].naturalWidth
    natHeight = image[0].naturalHeight
    
    ratio = natWidth / natHeight
    
    sX = 0
    sY = 0
    sWidth = natWidth
    sHeight = natHeight
    
    if ( (natWidth / natHeight) > (16 / 9) ) {
        cHeight = natHeight
        cWidth = cHeight / 9 * 16
        dX = -((natWidth - cWidth) / 2)
        dY = 0
        dWidth = sWidth
        dHeight = sHeight
    } else {
        cWidth = natWidth
        cHeight = cWidth / 16 * 9
        dX = 0
        dY = -((natHeight - cHeight) / 2)
        dWidth = sWidth
        dHeight = sHeight
    }
    
    px = cHeight / 1080
    
    canvas[0].width = cWidth
    canvas[0].height = cHeight
    
    df = cHeight / eHeight
    
    drawImage()
    
}

drawImage = function() {
    
    context.clearRect(0, 0, cWidth, cHeight)
    
    let offY = 10
    
    context.save()
    
    if (frame) {
        offX = frameOffsetX - drawOffsetX
        x1 = offX*df
        if (frameMoving || frameMoved) {
            if (drawFrame) {
                xWidth = x2 - x1
                frameWidth = xWidth
            } else {
                xWidth = frameWidth
            }
        } else {
            xWidth = cWidth - (2 * x1)
            frameWidth = xWidth
        }
        x2 = x1 + xWidth
        context.beginPath()
        context.rect( x1, offY*px, xWidth, cHeight - (offY+ taskbarHeight + 10)*px )
        context.clip()
    }
    
    if (degree) {
        context.translate(cWidth / 2, cHeight / 2)
        context.rotate(degree * Math.PI / 180)
        context.translate(-(cWidth / 2), -(cHeight / 2))
    }
    
    context.drawImage(image[0], sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight)
    
    context.restore()
    
    if (frame) {
        context.strokeStyle = "rgba(255, 255, 255, 0.7)"
        context.lineWidth = px
        context.beginPath()
        context.strokeRect( x1, offY*px, xWidth, cHeight - (offY+ taskbarHeight + 10)*px )
    }
    
    
    
}

moveInCanvas = function(diffX, diffY) {
    
    dX = dX + (diffX * df)
    dY = dY + (diffY * df)
    
    drawImage()
    
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
    
    if (event.originalEvent.deltaY < 0) {
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
    
    drawImage()
    
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
    
    degree += deg
    
    drawImage()
    
}

showFile = function() {
    
    if (fileListIndex >= 0 && fileListIndex < fileList.length) {
        filename = fileList[fileListIndex].name
        filenameLabel.html(filename)
        
        url = URL.createObjectURL(fileList[fileListIndex])
        image.on("load", function() {
            drawToCanvas()
        })
        image.attr("src", url)
        imageNumber.html((fileListIndex+1) + "/" + fileList.length)

        if (!gridVisible) {
            jQuery(".line").toggle("hidden")
            gridVisible = !gridVisible
        }

    }
    
}

drawRect = function(x, y) {
    context.beginPath()
    if (draw === 1) {
        context.fillRect(0, 0, (x - drawOffsetX) * df, cHeight)
    } else if (draw === 2) {
        context.fillRect((x-drawOffsetX) * df, 0, cWidth, cHeight)
    }
    context.stroke()
}

resize = function() {
    if (window.innerHeight == screen.height) {
        eWidth = window.innerWidth
        jQuery("body").addClass("fullscreen")
    } else {
        eWidth = window.innerWidth - taskbarHeight
        jQuery("body").removeClass("fullscreen")
    }
    eHeight = eWidth / 16 * 9
    jQuery("#wrapper, #edit-canvas").css({
        height: eHeight + "px",
        width: eWidth + "px"
    })
    jQuery("#taskbar").css({
        width: eWidth + "px",
        height: (eHeight / 1080 * taskbarHeight) + "px"
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

document.addEventListener("DOMContentLoaded", function() {
    
    droparea = jQuery("#droparea")
    image = jQuery("#my_image")
    save = jQuery("#save")
    filenameLabel = jQuery("#filename")
    wrapper = jQuery("#wrapper")
    imageNumber = jQuery("#image-number")
    
    canvas = jQuery("#edit-canvas")
    context = canvas[0].getContext("2d")
    frameOffsetX = canvas[0].getBoundingClientRect().x + 10
    drawOffsetX = 0
    drawOffsetY = 0
                
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
            if (event.altKey && moveFrame) {
                // move frame
                frameMoving = true
            } else if (event.altKey && frame) {
                // draw frame
                frameOffsetX = event.pageX
                drawFrame = true
                drawOffsetX = canvas[0].getBoundingClientRect().x
                drawImage()
            } else {
                if (event.altKey) {
                    if (event.shiftKey) {
                        draw = 2 // draw black area at the right side
                    } else {
                        draw = 1 // draw black area at the left side
                    }
                    drawOffsetX = canvas[0].getBoundingClientRect().x
                    drawOffsetY = canvas[0].getBoundingClientRect().y
                } else {
                    move = true
                }
            }
        } else if (event.which === 3) {
            rotate = true
        }
    }).on("mousemove", function(event) {
        event.preventDefault()
        event.stopPropagation()
        if (event.altKey && frame && drawFrame) {
            frameOffsetX = event.pageX
            drawImage()
        } else {
            if (event.altKey && draw) {
                drawRect(event.pageX, event.pageY)
            } else {
                diffX = event.pageX - startX
                diffY = event.pageY - startY
                startX = event.pageX
                startY = event.pageY
                if (move) {
                    moveInCanvas(diffX, diffY)
                } else if (rotate) {
                    rotateInCanvas(diffX, event.pageY)
                } else if (frameMoving) {
                    frameMoved = true
                    jQuery("#frame-moved").removeClass("hidden")
                    frameOffsetX += diffX
                    drawImage()
                }
            }
        }
    }).on("mouseup", function(event) {
        event.stopPropagation()
        event.preventDefault()
        move = false
        rotate = false
        draw = false
        drawFrame = false
        frameMoving = false
    }).on("wheel", function(event) {
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
    
    jQuery("body").on("keydown", function(event) {
        let key = event.originalEvent.key
        if (key == "s") {   // save file
            saveClick()
        }
        if (key == "ArrowRight" ||   // next file
            key == "d") {
            fileListIndex++
            showFile()
        }
        if (key == "ArrowLeft" ||   //previous file
            key == "a") {
            fileListIndex--
            showFile()
        }
        if (key == "x") {  // reset image rotation
            degree = 0
            drawImage()
        }
        if (key == "ArrowUp") { // move image down
            if (event.shiftKey) {
                moveInCanvas(0, 5)
            } else {
                moveInCanvas(0, 1)
            }
        }
        if (key == "ArrowDown") {  //move image up
            if (event.shiftKey) {
                moveInCanvas(0, -5)
            } else {
                moveInCanvas(0, -1)
            }
        }
        if (key == "q") { // show / hide gridlines
            jQuery(".line").toggle("hidden")
            gridVisible = !gridVisible
        }
        if (key == "Escape" ||  // reload page
            key == "Delete") {
            event.preventDefault()
            event.stopPropagation()
            location.reload()
        }
        if (key == "f") {  // enable / disable frame mode
            frame = !frame
            jQuery("#frame-mode").toggle("hidden")
            drawImage()
        }
        if (key == "m" || key == "g") {
            moveFrame = true
        }
        if (key == "r") {
            frameMoved = false
            jQuery("#frame-moved").addClass("hidden")
            frameOffsetX = ((cWidth - frameWidth) / 2) / df
            drawImage()
        }
    })
    jQuery("body").on("keyup", function(event) {
        let key = event.originalEvent.key
        if (key == "m" || key == "g") {
            moveFrame = false
        }
    })
})

