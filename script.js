
// ========================================
// 1. QR CODE GENERATOR FOR LINKS OR TEXT
// ========================================

const qrInput = document.getElementById("qrInput");
const generateBtn = document.getElementById("generateBtn");
const qrResult = document.getElementById("qrResult");
const downloadBtn = document.getElementById("downloadBtn");
const qrMessage = document.getElementById("qrMessage");

generateBtn.addEventListener("click", () => {
    const text = qrInput.value.trim();

    if (!text) {
        qrMessage.textContent = "Please enter a link or some text.";
        return;
    }

    qrResult.replaceChildren();
    qrMessage.textContent = "";

    try {
        new QRCode(qrResult, {
            text: text,
            width: 220,
            height: 220,
            colorDark: "#111827",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        downloadBtn.classList.remove("hidden");
        qrMessage.textContent = "QR code generated successfully!";
    } catch (error) {
        qrMessage.textContent = "Unable to generate the QR code.";
        downloadBtn.classList.add("hidden");
    }
});


// Download the generated QR code as PNG

downloadBtn.addEventListener("click", () => {
    downloadQr(qrResult, "qr-code.png");
});


// ========================================
// 2. QR CODE FOR A PHOTO URL
// ========================================

const imageUrl = document.getElementById("imageUrl");
const imageQrBtn = document.getElementById("imageQrBtn");
const imageQrResult = document.getElementById("imageQrResult");
const downloadImageQrBtn =
    document.getElementById("downloadImageQrBtn");
const imageQrMessage = document.getElementById("imageQrMessage");

imageQrBtn.addEventListener("click", () => {
    const url = imageUrl.value.trim();

    if (!url) {
        imageQrMessage.textContent = "Please enter an image URL.";
        return;
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(url);
    } catch {
        imageQrMessage.textContent = "Please enter a valid image URL.";
        return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        imageQrMessage.textContent =
            "The image URL must begin with HTTP or HTTPS.";
        return;
    }

    imageQrResult.replaceChildren();
    imageQrMessage.textContent = "";

    try {
        new QRCode(imageQrResult, {
            text: parsedUrl.href,
            width: 220,
            height: 220,
            correctLevel: QRCode.CorrectLevel.H
        });

        downloadImageQrBtn.classList.remove("hidden");
        imageQrMessage.textContent =
            "QR code generated. Scan it to open the image URL.";
    } catch {
        imageQrMessage.textContent = "Unable to generate the photo QR code.";
        downloadImageQrBtn.classList.add("hidden");
    }
});

downloadImageQrBtn.addEventListener("click", () => {
    downloadQr(imageQrResult, "photo-qr-code.png");
});


// ========================================
// SHARED QR DOWNLOAD FUNCTION
// ========================================

function downloadQr(container, filename) {
    const canvas = container.querySelector("canvas");
    const image = container.querySelector("img");

    let dataUrl;

    if (canvas) {
        dataUrl = canvas.toDataURL("image/png");
    } else if (image) {
        dataUrl = image.src;
    } else {
        alert("Generate a QR code first.");
        return;
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();
}


// ========================================
// 3. PHOTO PREVIEW
// ========================================

const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const pdfBtn = document.getElementById("pdfBtn");
const pdfMessage = document.getElementById("pdfMessage");

let selectedPhotos = [];

photoInput.addEventListener("change", () => {
    selectedPhotos = Array.from(photoInput.files || []);

    photoPreview.replaceChildren();
    pdfMessage.textContent = "";

    if (selectedPhotos.length === 0) {
        return;
    }

    const validPhotos = selectedPhotos.every(file =>
        file.type.startsWith("image/")
    );

    if (!validPhotos) {
        selectedPhotos = [];
        photoInput.value = "";
        pdfMessage.textContent =
            "Please select image files only.";
        return;
    }

    selectedPhotos.forEach(file => {
        const img = document.createElement("img");
        img.alt = file.name;
        img.src = URL.createObjectURL(file);

        photoPreview.appendChild(img);
    });

    pdfMessage.textContent =
        `${selectedPhotos.length} photo(s) selected.`;
});


// ========================================
// 4. CONVERT PHOTOS TO PDF
// ========================================

pdfBtn.addEventListener("click", async () => {
    if (selectedPhotos.length === 0) {
        pdfMessage.textContent = "Please select at least one photo.";
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        pdfMessage.textContent =
            "The PDF library could not load. Check your internet connection.";
        return;
    }

    pdfBtn.disabled = true;
    pdfMessage.textContent = "Creating your PDF...";

    try {
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;

        for (let i = 0; i < selectedPhotos.length; i++) {
            const file = selectedPhotos[i];
            const dataUrl = await readFileAsDataURL(file);
            const image = await loadImage(dataUrl);

            if (i > 0) {
                pdf.addPage();
            }

            const maxWidth = pageWidth - margin * 2;
            const maxHeight = pageHeight - margin * 2;

            const scale = Math.min(
                maxWidth / image.naturalWidth,
                maxHeight / image.naturalHeight
            );

            const width = image.naturalWidth * scale;
            const height = image.naturalHeight * scale;

            const x = (pageWidth - width) / 2;
            const y = (pageHeight - height) / 2;

            const format = file.type === "image/png" ? "PNG" : "JPEG";

            let imageData = dataUrl;

            // jsPDF supports JPEG and PNG reliably.
            // Convert other browser-supported image formats to JPEG.
            if (!["image/png", "image/jpeg"].includes(file.type)) {
                const canvas = document.createElement("canvas");
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;

                const context = canvas.getContext("2d");

                if (!context) {
                    throw new Error("Could not process one of the photos.");
                }

                context.fillStyle = "#ffffff";
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0);

                imageData = canvas.toDataURL("image/jpeg", 0.92);
            }

            pdf.addImage(
                imageData,
                ["image/png", "image/jpeg"].includes(file.type)
                    ? format
                    : "JPEG",
                x,
                y,
                width,
                height
            );
        }

        pdf.save("my-photos.pdf");
        pdfMessage.textContent = "PDF downloaded successfully!";
    } catch (error) {
        console.error(error);
        pdfMessage.textContent =
            "Could not create the PDF. Try smaller or different image files.";
    } finally {
        pdfBtn.disabled = false;
    }
});


// Read a photo as a data URL

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(
            new Error("Could not read the selected photo.")
        );

        reader.readAsDataURL(file);
    });
}


// Load an image so its dimensions can be calculated

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(
            new Error("Could not load one of the selected photos.")
        );

        image.src = src;
    });
}
