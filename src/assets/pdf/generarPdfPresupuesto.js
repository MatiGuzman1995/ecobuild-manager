import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts.js";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// 🔁 Logo Base64 (reemplazar por el tuyo completo)
const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABZklEQVR4Xu3ZUYrDIBAF0Wn//3M60V62VDtUoSbO3fwjSwmxjSPdZ+v5XAgaQuuCEjYaF7AEtmNAAA4pbKuJgAQCALkIwQAANwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAALwACBEAAH8Ch6UQx0kCN5eZAAAAAElFTkSuQmCC";

export async function generarPdfPresupuesto(presupuesto, detalles) {

    const fecha = new Date().toLocaleDateString("es-AR");

    console.log("✅ DETALLES RECIBIDOS →", detalles);

    const docDefinition = {
        pageMargins: [40, 100, 40, 80],

        header: {
            margin: [40, 20],
            columns: [
                { image: logoBase64, width: 70 },
                {
                    stack: [
                        { text: "Terra-C", fontSize: 16, bold: true, color: "#2e7d32" },
                        { text: "EcoBuild Manager", fontSize: 10, color: "#555" }
                    ],
                    margin: [10, 5]
                },
                {
                    text: `Presupuesto #${presupuesto.id_presupuesto}`,
                    alignment: "right",
                    margin: [0, 15],
                    fontSize: 13,
                    bold: true
                }
            ]
        },


        footer: (currentPage, pageCount) => ({
            columns: [
                { text: `Página ${currentPage} de ${pageCount}`, alignment: "left", margin: [40, 0] },
                { text: "Terra-C | www.terrac.com.ar", alignment: "right", margin: [0, 0, 40, 0] }
            ],
            fontSize: 8
        }),

        content: [
            { text: `Cliente: ${presupuesto.cliente_apellido} ${presupuesto.cliente_nombre}`, bold: true },
            { text: `CUIT/CUIL: ${presupuesto.cuit ?? "-"}` },
            { text: `Proyecto: ${presupuesto.proyecto}` },
            { text: `Fecha: ${fecha}`, margin: [0, 0, 0, 10] },
            { text: " ", margin: [0, 10] },

            {
                table: {
                    headerRows: 1,
                    widths: ["*", "auto", "auto", "auto"],
                    body: [
                        ["Material", "Cantidad", "Precio Unit.", "Subtotal"],
                        ...detalles.map(d => {

                            const nombreMaterial =
                                d.material_nombre ||
                                d.descripcion ||
                                d.nombre ||
                                `Material ${d.id_material}`;
                            const cantidad = Number(d.cantidad);
                            const precioUnit = d.precio_unitario ?? d.precio;
                            const subtotal = d.cantidad * precioUnit;

                            return [
                                nombreMaterial,
                                d.cantidad.toFixed(2),
                                `$ ${precioUnit.toLocaleString("es-AR")}`,
                                `$ ${subtotal.toLocaleString("es-AR")}`
                            ];
                        })
                    ]
                },
                layout: "lightHorizontalLines"
            },

            {
                text: `\nTOTAL: $ ${presupuesto.monto.toLocaleString("es-AR")}`,
                fontSize: 13,
                bold: true,
                alignment: "right",
                margin: [0, 10]
            },
            {
                text: `IVA (21%): $ ${(presupuesto.monto * 0.21).toLocaleString("es-AR")}`,
                fontSize: 11,
                alignment: "right"
            },
            {
                text: `TOTAL + IVA: $ ${(presupuesto.monto * 1.21).toLocaleString("es-AR")}`,
                fontSize: 13,
                bold: true,
                alignment: "right",
                margin: [0, 5]
            },

            { text: "\nGracias por confiar en Terra-C", alignment: "center", italics: true },
            { text: "contacto@terrac.com • Córdoba, AR", alignment: "center", fontSize: 9 }
        ],

        defaultStyle: { fontSize: 10 }
    };

    pdfMake.createPdf(docDefinition).open();
}
