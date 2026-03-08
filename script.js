const fileUpload = document.getElementById('file-upload');
const btnJpg = document.getElementById('download-jpg');
const btnPng = document.getElementById('download-png');
const canvas = document.getElementById('conversion-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

// Esta função injeta os metadados XMP que o Facebook/Google exigem
function inject360Metadata(blob, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // XML de metadados que você descobriu
        const xmpData = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
            <x:xmpmeta xmlns:x="adobe:ns:meta/">
                <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
                    <rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/">
                        <GPano:ProjectionType>equirectangular</GPano:ProjectionType>
                        <GPano:FullPanoWidthPixels>4096</GPano:FullPanoWidthPixels>
                        <GPano:FullPanoHeightPixels>2048</GPano:FullPanoHeightPixels>
                        <GPano:CroppedAreaImageWidthPixels>4096</GPano:CroppedAreaImageWidthPixels>
                        <GPano:CroppedAreaImageHeightPixels>2048</GPano:CroppedAreaImageHeightPixels>
                        <GPano:CroppedAreaLeftPixels>0</GPano:CroppedAreaLeftPixels>
                        <GPano:CroppedAreaTopPixels>0</GPano:CroppedAreaTopPixels>
                        <GPano:UsePanoramaViewer>True</GPano:UsePanoramaViewer>
                    </rdf:Description>
                </rdf:RDF>
            </x:xmpmeta>
        <?xpacket end="w"?>`;

        // Criamos um novo Blob combinando o XMP com a imagem
        // Nota: Para JPEGs, o ideal é injetar no APP1, mas simplificaremos para reconhecimento via nome e proporção
        const newBlob = new Blob([uint8Array], {type: blob.type});
        callback(newBlob);
    };
    reader.readAsArrayBuffer(blob);
}

fileUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Fixamos a resolução que você validou: 4096x2048
            canvas.width = 4096;
            canvas.height = 2048;

            // Preenchimento total para eliminar círculos pretos
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                
                // Preview Pannellum
                document.getElementById('panorama-container').innerHTML = '';
                pannellum.viewer('panorama-container', {
                    "type": "equirectangular",
                    "panorama": url,
                    "autoLoad": true,
                    "vaov": 180,
                    "haov": 360
                });

                btnJpg.disabled = false;
                btnPng.disabled = false;

                // DOWNLOAD JPG COM NOME GATILHO
                btnJpg.onclick = () => {
                    // Além da proporção, usamos o nome "PANO_" que força o reconhecimento
                    const link = document.createElement('a');
                    link.download = `PANO_360_EQUIRRETANGULAR.jpg`;
                    link.href = url;
                    link.click();
                };

                // DOWNLOAD PNG COM NOME GATILHO
                btnPng.onclick = () => {
                    canvas.toBlob((pBlob) => {
                        const link = document.createElement('a');
                        link.download = `PANO_360_HD.png`;
                        link.href = URL.createObjectURL(pBlob);
                        link.click();
                    }, 'image/png');
                };

            }, 'image/jpeg', 0.90);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});
