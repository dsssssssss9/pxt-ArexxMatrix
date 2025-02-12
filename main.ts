/*
Arexx Engineering Micro:Bit extension for WS2812b/NeoPixel Matrixes
Author: Sjors Smit
Version: 1.2; 11/11/2019
*/

enum Directions {
    //% block=links
    links = 0,
    //% block=rechts
    rechts = 1
}

//% color=#AA00AA weight=50 icon="\uf00a" block="Arexx Matrix"
//% groups=['LED matrix']
namespace ArexxMatrix {
    let matrix: neopixel.Strip
    let MatrixHeigth: number
    let MatrixWidth: number
    /** 
     * generates the neopixel object, if it doesn't already exist
     */
    //%block="create matrix with height %Heigth| and width %Width| with RGB type %mode| op pin %PinNumber"
    //%weight=100
    //% Heigth.defl=10 Width.defl=20 PinNumber.defl=DigitalPin.P2
    export function createMatrix(Heigth: number, Width: number, mode: NeoPixelMode, PinNumber: DigitalPin): void {
        if (!matrix) {
            matrix = neopixel.create(PinNumber, Heigth * Width, mode)
            ArexxMatrix.Brightness(32)
            MatrixHeigth = Heigth
            MatrixWidth = Width
        }
    }


    //%block
    //%advanced=true
    //%weigth=1
    export function getWidth() {
        return MatrixWidth
    }
    //%block
    //%advanced=true
    //%weigth=1
    export function getHeigth() {
        return MatrixHeigth
    }
    /**
     * Show Display Changes
     */
    //%block="Show matrix changes"
    export function showMatrix(): void {
        matrix.show()
    }
    /**
     * Turn Off matrix
     */
    //% block="Matrix Clear"
    //% weight=1
    export function legen(): void {
        matrix.clear()
    }

    /**
    * Set a pixel at this position to a certain color.
    * Pay attention! The pixels only turn on after the block "Show matrix changes"
    */
    //% block="Zet pixel op positie x %x| y %y| op kleur %colour"
    //% colour.shadow="Matrix_rgb"
    //% weight=100
    export function setPixel(x: number, y: number, colour: number) {
        if (x >= MatrixWidth) { x = MatrixWidth - 1 }
        if (y >= MatrixHeigth) { y = MatrixHeigth - 1 }
        //oneven rijen gaan van boven naar beneden geteld:
        if (!(x % 2)) {
            matrix.setPixelColor((y + MatrixHeigth * x), colour)
        }
        else {
            matrix.setPixelColor(((MatrixHeigth - 1 - y) + MatrixHeigth * x), colour)
        }
    }
    //% block="Scroll text %data met wachttijd %delayTime en kleur %colour scroll naar %direction=ArexxMatrix_Direction"
    //% colour.shadow="Matrix_rgb"
    //% weight=95
    //% delayTime.min=0 delayTime.max=2000
    export function scrollText(data: string, delayTime: number, colour: number, direction: number): void {
        matrix.clear()
        matrix.show()
        if (direction == 0) {
            for (let Xpos = MatrixWidth; Xpos > -(data.length * 6); Xpos--) {
                for (let i = 0; i < data.length; i++) {
                    for (let k = 0; k < 5; k++) {
                        if ((Xpos + (i * 6) > -6 && ((Xpos + (i * 6)) < 32))) {
                            let letterMap = getLettermap(data.charAt(i))
                            //checking for odd or even row, to depend pixel direction (zigzag pattern)
                            if (!((Xpos + k) % 2)) {
                                for (let j = 0; j < 8; j++) {
                                    if ((letterMap[j] & (0x10 >> k))) {
                                        matrix.setPixelColor(((k * MatrixHeigth) + (Xpos * MatrixHeigth) + j + (MatrixHeigth - 8) / 2) + (i * MatrixHeigth * 6), ((colour)))
                                    }
                                }
                            }
                            else {
                                for (let j = 0; j < 8; j++) {
                                    if ((letterMap[j] & (0x10 >> k))) {
                                        matrix.setPixelColor(((k * MatrixHeigth) + (Xpos * MatrixHeigth) + (7 + (MatrixHeigth - 8) / 2 - j)) + (i * MatrixHeigth * 6), ((colour)))
                                    }
                                }
                            }
                        }
                    }
                }
                matrix.show()
                matrix.clear()
                basic.pause(delayTime)
            }
        }
        else {
            for (let Xpos = -(data.length * 6); Xpos < MatrixWidth; Xpos++) {
                for (let i = data.length; i > 0; i--) {
                    for (let k = 0; k < 5; k++) {
                        if ((Xpos + (i * 6) > -6 && ((Xpos + (i * 6)) < 32))) {
                            let letterMap = getLettermap(data.charAt(i - 1))
                            if (!((Xpos + k) % 2)) {
                                for (let j = 0; j < MatrixHeigth; j++) {
                                    if ((letterMap[j] & (0x10 >> k))) {
                                        matrix.setPixelColor(((k * MatrixHeigth) + (Xpos * MatrixHeigth) + j + (MatrixHeigth - 8) / 2) + (i * MatrixHeigth * 6), ((colour)))
                                    }
                                }
                            }
                            else {
                                for (let j = 0; j < MatrixHeigth; j++) {
                                    if ((letterMap[j] & (0x10 >> k))) {
                                        matrix.setPixelColor(((k * MatrixHeigth) + (Xpos * MatrixHeigth) + (7 + (MatrixHeigth - 8) / 2 - j)) + (i * MatrixHeigth * 6), ((colour)))
                                    }
                                }
                            }
                        }
                    }
                }
                matrix.show()
                matrix.clear()
                basic.pause(delayTime)
            }
        }
    }

    /**
     * Draws a bitmap on the matrix
     */
    //%block
    //%advanced=true
    //%colour.shadow="Matrix_rgb"
    //%weigth=100
    //%xoffset.defl=0 yoffset.defl=0
    export function drawBitmap(bitmap: number[], width: number, heigth: number, colour: number, xoffset: number, yoffset: number, doMirror:boolean=false): void {
        let mirrored=0
        if(doMirror){
            mirrored=1
        }
        if(width % 2){
            width++
        }
        //Setting end value of k to equal the width of the image to shift the bitmask to the correct position. for drawing the x-axis
        for (let k = 0; k < width; k++) {
            //Due to the zig-zag pattern of the matrix every odd value on the matrix has to be drawn from bottom to top, and the others top to bottom.
            if (!((xoffset + k+ mirrored) % 2)) {
                //Value of j to select the values in the array to draw on the y-axis
                for (let j = 0; j < heigth; j++) {
                    //only draw a pixel when there is a '1' in the bitmap, without drawing a "black" pixel when there is a '0', allowing layering of bitmaps.
                    if ((bitmap[j] & (0b1 << (width - k-1)))&&((j+yoffset)<MatrixHeigth)&&((yoffset+j)>=0)) {
                        //Draw the actual pixel at the position determined by the k, j , xoffset and yoffset values.
                        matrix.setPixelColor((((((mirrored-1)*(-k) + xoffset) + ((width-k-1)*mirrored)) * MatrixHeigth) + j + yoffset), colour)
                    }
                }
            }
            //Drawing the odd lines top to bottom.
            else {
                for (let j = 0; j < heigth; j++) {
                    if ((bitmap[j] & (0b1 << (width - k-1))) &&((yoffset+j)<MatrixHeigth)&&((yoffset+j)>=0)) {
                        matrix.setPixelColor((((((mirrored-1)*(-k) + xoffset)+((width - k-1)*mirrored)) * MatrixHeigth) + (MatrixHeigth - j - yoffset-1)), colour)
                    }
                }
            }
        }
    }
    /**
    * Geeft aan in welke richting de tekst moet scrollen
    */
    //% weight=2 blockGap=8
    //% blockId="ArexxMatrix_Direction" block="%direction"
    //% advanced=true
    export function Direction(direction: Directions): number {
        return direction;
    }

    //%block="zet Matrix helderheid (0-255) %setPoint" 
    //%setPoint.max=255 setPoint.min=0 setPoint.defl=32
    export function Brightness(setPoint: number) {
        matrix.setBrightness(setPoint)
    }

    /**
     * Zet rood, groen en blauw waarden om in een RGB-kleur
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% weight=1
    //% blockId="Matrix_rgb" block="rood %red|groen %green|blauw %blue"
    //% advanced=true
    //%red.defl=255 blue.defl=255 green.defl=255
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }

    function packRGB(a: number, b: number, c: number): number {
        return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF);
    }


    export function getLettermap(l: string) {
        switch (l) {
            case "a": return [
                0x00,
                0x00,
                0x0E,
                0x01,
                0x0F,
                0x11,
                0x0F,
                0x00]
            case "b": return [
                0x10,
                0x10,
                0x1E,
                0x11,
                0x11,
                0x11,
                0x1E,
                0x00]
            case "c": return [
                0x00,
                0x00,
                0x0E,
                0x10,
                0x10,
                0x10,
                0x0E,
                0x00
            ]
            case "d": return [
                0x01,
                0x01,
                0x0F,
                0x11,
                0x11,
                0x11,
                0x0F,
                0x00
            ]
            case "e": return [
                0x00,
                0x00,
                0x0E,
                0x11,
                0x1F,
                0x10,
                0x0E,
                0x00
            ]
            case "f": return [
                0x06,
                0x09,
                0x08,
                0x1C,
                0x08,
                0x08,
                0x08,
                0x00
            ]
            case "g": return [
                0x00,
                0x00,
                0x0F,
                0x11,
                0x11,
                0x0F,
                0x01,
                0x0E
            ]
            case "h": return [
                0x10,
                0x10,
                0x16,
                0x19,
                0x11,
                0x11,
                0x11,
                0x00
            ]
            case "i": return [
                0x04,
                0x00,
                0x0C,
                0x04,
                0x04,
                0x04,
                0x0E,
                0x00
            ]
            case "j": return [
                0x02,
                0x00,
                0x06,
                0x02,
                0x02,
                0x02,
                0x12,
                0x0C
            ]
            case "k": return [
                0x08,
                0x08,
                0x09,
                0x0A,
                0x0C,
                0x0A,
                0x09,
                0x00
            ]
            case "l": return [
                0x0C,
                0x04,
                0x04,
                0x04,
                0x04,
                0x04,
                0x0E,
                0x00
            ]
            case "m": return [
                0x00,
                0x00,
                0x1A,
                0x15,
                0x15,
                0x11,
                0x11,
                0x00
            ]
            case "n": return [
                0x00,
                0x00,
                0x16,
                0x19,
                0x11,
                0x11,
                0x11,
                0x00
            ]
            case "o": return [
                0x00,
                0x00,
                0x0E,
                0x11,
                0x11,
                0x11,
                0x0E,
                0x00
            ]
            case "p": return [
                0x00,
                0x00,
                0x1E,
                0x11,
                0x11,
                0x1E,
                0x10,
                0x10
            ]
            case "q": return [
                0x00,
                0x00,
                0x0F,
                0x11,
                0x11,
                0x0F,
                0x01,
                0x01
            ]
            case "r": return [
                0x00,
                0x00,
                0x16,
                0x19,
                0x10,
                0x10,
                0x10,
                0x00
            ]
            case "s": return [
                0x00,
                0x00,
                0x0E,
                0x10,
                0x0E,
                0x01,
                0x1E,
                0x00
            ]
            case "t": return [
                0x08,
                0x08,
                0x1C,
                0x08,
                0x08,
                0x09,
                0x06,
                0x00
            ]
            case "u": return [
                0x00,
                0x00,
                0x11,
                0x11,
                0x11,
                0x13,
                0x0D,
                0x00
            ]
            case "v": return [
                0x00,
                0x00,
                0x11,
                0x11,
                0x11,
                0x0A,
                0x04,
                0x00
            ]
            case "w": return [
                0x00,
                0x00,
                0x11,
                0x11,
                0x15,
                0x15,
                0x0A,
                0x00
            ]
            case "x": return [
                0x00,
                0x00,
                0x11,
                0x0A,
                0x04,
                0x0A,
                0x11,
                0x00
            ]
            case "y": return [
                0x00,
                0x00,
                0x11,
                0x11,
                0x11,
                0x0F,
                0x01,
                0x0E
            ]
            case "z": return [
                0x00,
                0x00,
                0x1F,
                0x02,
                0x04,
                0x08,
                0x1F,
                0x00
            ]
            case "A": return [
                0x0E,
                0x11,
                0x11,
                0x11,
                0x1F,
                0x11,
                0x11,
                0x00
            ]
            case "B": return [
                0x1E,
                0x11,
                0x11,
                0x1E,
                0x11,
                0x11,
                0x1E,
                0x00
            ]
            case "C": return [
                0x0E,
                0x11,
                0x10,
                0x10,
                0x10,
                0x11,
                0x0E,
                0x00
            ]
            case "D": return [
                0x1C,
                0x12,
                0x11,
                0x11,
                0x11,
                0x12,
                0x1C,
                0x00
            ]
            case "E": return [
                0x1F,
                0x10,
                0x10,
                0x1E,
                0x10,
                0x10,
                0x1F,
                0x00
            ]
            case "F": return [
                0x1F,
                0x10,
                0x10,
                0x1C,
                0x10,
                0x10,
                0x10,
                0x00
            ]
            case "G": return [
                0x0E,
                0x11,
                0x10,
                0x10,
                0x13,
                0x11,
                0x0E,
                0x00
            ]
            case "H": return [
                0x11,
                0x11,
                0x11,
                0x1F,
                0x11,
                0x11,
                0x11,
                0x00
            ]
            case "I": return [
                0x0E,
                0x04,
                0x04,
                0x04,
                0x04,
                0x04,
                0x0E,
                0x00
            ]
            case "J": return [
                0x07,
                0x02,
                0x02,
                0x02,
                0x02,
                0x02,
                0x12,
                0x0C
            ]
            case "K": return [
                0x11,
                0x12,
                0x14,
                0x18,
                0x14,
                0x12,
                0x11,
                0x00
            ]
            case "L": return [
                0x10,
                0x10,
                0x10,
                0x10,
                0x10,
                0x10,
                0x1F,
                0x00
            ]
            case "M": return [
                0x11,
                0x1B,
                0x15,
                0x11,
                0x11,
                0x11,
                0x11,
                0x00
            ]
            case "N": return [
                0x11,
                0x11,
                0x19,
                0x15,
                0x13,
                0x11,
                0x11,
                0x00
            ]
            case "O": return [
                0x0E,
                0x11,
                0x11,
                0x11,
                0x11,
                0x11,
                0x0E,
                0x00
            ]
            case "P": return [
                0x1E,
                0x11,
                0x11,
                0x1e,
                0x10,
                0x10,
                0x10,
                0x00
            ]
            case "Q": return [
                0x0E,
                0x11,
                0x11,
                0x11,
                0x15,
                0x12,
                0x0D,
                0x00
            ]
            case "R": return [
                0x1e,
                0x11,
                0x11,
                0x1E,
                0x14,
                0x12,
                0x11,
                0x00
            ]
            case "S": return [
                0x0F,
                0x10,
                0x10,
                0x0E,
                0x01,
                0x01,
                0x1E,
                0x00
            ]
            case "T": return [
                0x1F,
                0x04,
                0x04,
                0x04,
                0x04,
                0x04,
                0x04,
                0x00
            ]
            case "U": return [
                0x11,
                0x11,
                0x11,
                0x11,
                0x11,
                0x11,
                0x0E,
                0x00
            ]
            case "V": return [
                0x11,
                0x11,
                0x11,
                0x11,
                0x11,
                0x0A,
                0x04,
                0x00
            ]
            case "W": return [
                0x11,
                0x11,
                0x11,
                0x15,
                0x15,
                0x1B,
                0x11,
                0x00
            ]
            case "X": return [
                0x11,
                0x11,
                0x0A,
                0x04,
                0x0A,
                0x11,
                0x11,
                0x00
            ]
            case "Y": return [
                0x11,
                0x11,
                0x0A,
                0x04,
                0x04,
                0x04,
                0x04,
                0x00
            ]
            case "Z": return [
                0x1F,
                0x01,
                0x02,
                0x04,
                0x08,
                0x10,
                0x1F,
                0x00
            ]
            case ".": return [
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x0C,
                0x0C,
                0x00
            ]
            case "0": return [
                0x0E,
                0x011,
                0x13,
                0x15,
                0x19,
                0x11,
                0x0E,
                0x00
            ]
            case "1": return [
                0x04,
                0x0C,
                0x04,
                0x04,
                0x04,
                0x04,
                0x0E,
                0x00
            ]
            case "2": return [
                0x0E,
                0x11,
                0x01,
                0x02,
                0x04,
                0x08,
                0x1F,
                0x00
            ]
            case "3": return [
                0x1F,
                0x02,
                0x04,
                0x02,
                0x01,
                0x11,
                0x0E,
                0x00
            ]
            case "4": return [
                0x02,
                0x06,
                0x0A,
                0x12,
                0x1F,
                0x02,
                0x02,
                0x00
            ]
            case "5": return [
                0x1F,
                0x10,
                0x1E,
                0x01,
                0x01,
                0x11,
                0x0E,
                0x00
            ]
            case "6": return [
                0x06,
                0x08,
                0x10,
                0x1E,
                0x11,
                0x11,
                0x0E,
                0x00
            ]
            case "7": return [
                0x1F,
                0x01,
                0x02,
                0x04,
                0x08,
                0x08,
                0x08,
                0x00
            ]
            case "8": return [
                0x0E,
                0x11,
                0x11,
                0x0E,
                0x11,
                0x11,
                0x0E,
                0x00
            ]
            case "9": return [
                0x0E,
                0x11,
                0x11,
                0x0F,
                0x01,
                0x02,
                0x0C,
                0x00
            ]
            case ",": return [
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x0C,
                0x04,
                0x10
            ]
            case ":": return [
                0x00,
                0x0c,
                0x0c,
                0x00,
                0x0C,
                0x0C,
                0x00,
                0x00
            ]
            case ";": return [
                0x00,
                0x0c,
                0x0c,
                0x00,
                0x0C,
                0x04,
                0x10,
                0x00
            ]
            case "?": return [
                0x0E,
                0x11,
                0x02,
                0x02,
                0x04,
                0x00,
                0x04,
                0x00
            ]
            case "!": return [
                0x04,
                0x04,
                0x04,
                0x04,
                0x04,
                0x00,
                0x04,
                0x00
            ]
            case "-": return [
                0x00,
                0x00,
                0x00,
                0x1F,
                0x00,
                0x00,
                0x00,
                0x00
            ]
            case "+": return [
                0x00,
                0x04,
                0x04,
                0x1F,
                0x04,
                0x04,
                0x00,
                0x00
            ]
            case "=": return [
                0x00,
                0x00,
                0x1F,
                0x00,
                0x1F,
                0x00,
                0x00,
                0x00
            ]
            case "*": return [
                0x00,
                0x0A,
                0x04,
                0x1F,
                0x04,
                0x0A,
                0x00,
                0x00
            ]
            case "/": return [
                0x00,
                0x01,
                0x02,
                0x04,
                0x08,
                0x10,
                0x00,
                0x00
            ]
            case "(": return [
                0x02,
                0x04,
                0x08,
                0x08,
                0x08,
                0x04,
                0x02,
                0x00
            ]
            case ")": return [
                0x08,
                0x04,
                0x02,
                0x02,
                0x02,
                0x04,
                0x08,
                0x00
            ]
            case "<": return [
                0x01,
                0x02,
                0x04,
                0x08,
                0x04,
                0x02,
                0x01,
                0x00
            ]
            case ">": return [
                0x10,
                0x08,
                0x04,
                0x02,
                0x04,
                0x08,
                0x10,
                0x00
            ]
            case "^": return [
                0x04,
                0x0A,
                0x11,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00
            ]
            case "%": return [
                0x18,
                0x19,
                0x02,
                0x04,
                0x08,
                0x0B,
                0x03,
                0x00
            ]
            case "&": return [
                0x0C,
                0x12,
                0x14,
                0x08,
                0x15,
                0x12,
                0x0D,
                0x00
            ]
            case "#": return [
                0x0A,
                0x0A,
                0x1F,
                0x0A,
                0x1F,
                0x0A,
                0x0A,
                0x00
            ]
            case "$": return [
                0x04,
                0x0E,
                0x14,
                0x0E,
                0x05,
                0x1E,
                0x04,
                0x00
            ]
            case "@": return [
                0x0E,
                0x11,
                0x01,
                0x0D,
                0x15,
                0x15,
                0x0E,
                0x00
            ]
            default: return [
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00
            ];
        }
    }
}
