type Ligne = { desc: string; soustitems: string[]; qte: number; pu: number }

type Params = {
  nom: string; agence: string; email: string; telephone: string
  adresse: string; siret: string; tva: string; taux_tva: string
  assujetti_tva: boolean; iban: string; mention_legale: string
}

type Document = {
  numero: string; client: string; projet: string
  adresse_client: string
  date_emission: string; date_echeance: string
  montant: number; statut: string; lignes: Ligne[]
}

const LOGO_BASE64 = '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'
function fmtMoney(n: number): string {
  const parts  = n.toFixed(2).split('.')
  const entier = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')
  return `${entier},${parts[1]}\u00A0\u20AC`
}

export async function generatePDF(doc: Document, params: Params, type: 'facture' | 'devis') {
  const { jsPDF }              = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W        = 210
  const margin   = 14
  const contentW = W - margin * 2

  const noir:    [number,number,number] = [20,  20,  20]
  const gris:    [number,number,number] = [130, 130, 130]
  const grisCl:  [number,number,number] = [210, 210, 210]
  const orange:  [number,number,number] = [255, 107, 43]
  const blanc:   [number,number,number] = [255, 255, 255]
  const fondGris:[number,number,number] = [242, 242, 242]

  // ── PAGE BLANCHE
  pdf.setFillColor(...blanc)
  pdf.rect(0, 0, W, 297, 'F')

  // ── LOGO (fond blanc derrière pour masquer le fond noir du JPG)
  pdf.setFillColor(255, 255, 255)
  pdf.rect(margin, 10, 42, 37, 'F')
  try {
  pdf.addImage(LOGO_BASE64, 'PNG', margin, 10, 42, 37)
  } catch {
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...noir)
    pdf.text('MAZCOM', margin, 28)
  }

  // ── TITRE DOCUMENT (droite)
  pdf.setFontSize(38)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...noir)
  pdf.text(type === 'facture' ? 'FACTURE' : 'DEVIS', W - margin, 26, { align: 'right' })

  // ── Cercles décoratifs
  const circleY = 33
  const circleColors: [number,number,number][] = [[180,180,180], [210,210,210], orange, noir]
  circleColors.forEach((col, i) => {
    pdf.setFillColor(...col)
    pdf.circle(W - margin - 2 - i * 9, circleY, 3.5, 'F')
  })

  // ── Numéro
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...gris)
  pdf.text(`${type === 'facture' ? 'Facture' : 'Devis'} n°${doc.numero}`, W - margin, 42, { align: 'right' })

  // ── LIGNE SÉPARATRICE
  pdf.setDrawColor(...grisCl)
  pdf.setLineWidth(0.4)
  pdf.line(margin, 52, W - margin, 52)

  // ── DATE
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...noir)
  pdf.text(`DATE : ${doc.date_emission || new Date().toLocaleDateString('fr-FR')}`, margin, 61)

  // ── LIGNE sous date
  pdf.setDrawColor(...grisCl)
  pdf.setLineWidth(0.3)
  pdf.line(margin, 65, W - margin, 65)

  // ── DESTINATAIRE (droite)
  let y = 75
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...gris)
  pdf.text('DESTINATAIRE :', W - margin, y, { align: 'right' })

  y += 7
  const adresseLines = (doc.adresse_client || doc.client || '—').split('\n').filter(Boolean)
  adresseLines.forEach((line, i) => {
    if (i === 0) {
      pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
    } else {
      pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
    }
    pdf.setTextColor(...noir)
    pdf.text(line.trim(), W - margin, y + i * 6, { align: 'right' })
  })
  y += adresseLines.length * 6 + 6

  // ── TITRE PROJET
  if (doc.projet) {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...noir)
    const projetLines = pdf.splitTextToSize(doc.projet.toUpperCase(), contentW)
    projetLines.slice(0, 2).forEach((line: string, i: number) => {
      pdf.text(line, margin, y + i * 6)
    })
    y += projetLines.slice(0, 2).length * 6 + 4
  }

  // ── TABLEAU PRESTATIONS
  const tableStartY = Math.max(y, 108)
  const tableBody: any[] = []

  doc.lignes.forEach(l => {
    tableBody.push([
      { content: l.desc, styles: { fontStyle: 'normal', fontSize: 9, textColor: noir } },
      { content: fmtMoney(l.qte * l.pu), styles: { halign: 'right', fontStyle: 'bold', fontSize: 9, textColor: noir } },
    ])
    if (l.soustitems && l.soustitems.length > 0) {
      l.soustitems.filter(Boolean).forEach(s => {
        tableBody.push([
          { content: `• ${s}`, styles: { fontStyle: 'normal', fontSize: 8, textColor: gris, cellPadding: { top: 1, bottom: 1, left: 6, right: 2 } } },
          { content: '', styles: {} },
        ])
      })
    }
  })

  autoTable(pdf, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    tableWidth: contentW,
    head: [[
      { content: 'Description :', styles: { halign: 'left', fontStyle: 'bold', fontSize: 10, textColor: noir, fillColor: blanc } },
      { content: 'Prix :', styles: { halign: 'right', fontStyle: 'bold', fontSize: 10, textColor: noir, fillColor: blanc } },
    ]],
    body: tableBody,
    headStyles: {
      fillColor: blanc,
      textColor: noir,
      fontSize: 10,
      fontStyle: 'bold',
      cellPadding: { top: 4, bottom: 6, left: 2, right: 2 },
      lineColor: grisCl,
      lineWidth: { bottom: 0.4 },
    },
    bodyStyles: {
      fillColor: blanc,
      fontSize: 9,
      textColor: noir,
      cellPadding: { top: 5, bottom: 5, left: 2, right: 2 },
      lineColor: grisCl,
      lineWidth: { bottom: 0.3 },
      overflow: 'linebreak',
      minCellHeight: 8,
    },
    columnStyles: {
      0: { cellWidth: contentW * 0.74 },
      1: { cellWidth: contentW * 0.26, halign: 'right' },
    },
    theme: 'plain',
  })

  const finalY = (pdf as any).lastAutoTable.finalY + 6

  // ── TOTAL + RÈGLEMENT
  const totalHT  = doc.lignes.reduce((s, l) => s + l.qte * l.pu, 0)
  const tauxTva  = params.assujetti_tva ? parseFloat(params.taux_tva || '20') / 100 : 0
  const totalTTC = totalHT * (1 + tauxTva)
  const reglBoxH = params.iban ? 22 : 14

  pdf.setFillColor(...fondGris)
  pdf.roundedRect(margin, finalY, contentW, reglBoxH, 1, 1, 'F')

  // Règlement gauche
  if (params.iban) {
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...noir)
    pdf.text('RÈGLEMENT :', margin + 4, finalY + 7)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...gris)
    pdf.text('Par virement bancaire :', margin + 32, finalY + 7)
    pdf.text(`Titulaire : ${params.nom}`, margin + 32, finalY + 12)
    pdf.text(`IBAN : ${params.iban}`, margin + 32, finalY + 17)
  }

  // Total TTC droite — sur une seule ligne bien espacée
  const totalStr = `TOTAL TTC : ${fmtMoney(totalTTC)}`
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...noir)
  pdf.text(totalStr, W - margin - 4, finalY + (reglBoxH / 2) + 3, { align: 'right' })

  // Point orange décoratif
  pdf.setFillColor(...orange)
  pdf.circle(W - margin - 2, finalY + reglBoxH + 3, 2, 'F')

  // ── PIED DE PAGE
  const footerY = 284
  pdf.setDrawColor(...grisCl)
  pdf.setLineWidth(0.3)
  pdf.line(margin, footerY - 3, W - margin, footerY - 3)

  pdf.setFontSize(6.5)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...gris)

  const siretLine  = `Micro-entrepreneur - N° Siret ${params.siret || '—'} - Dispensé d'immatriculation au RCS en application de l'article L123-1-1 du code de commerce - ${type === 'facture' ? 'Facture' : 'Devis'} n°${doc.numero}`
  const tvaLine    = params.assujetti_tva ? `N° TVA : ${params.tva}` : 'TVA non applicable, art. 293 B du CGI'
  const adrLine    = `Siège social : ${params.adresse || '—'}`

  const siretLines = pdf.splitTextToSize(siretLine, contentW)
  siretLines.forEach((line: string, i: number) => {
    pdf.text(line, W / 2, footerY + i * 3.8, { align: 'center' })
  })
  pdf.text(`${tvaLine} - ${adrLine}`, W / 2, footerY + siretLines.length * 3.8, { align: 'center' })

  // ── SAUVEGARDE
  pdf.save(`${type === 'facture' ? 'Facture' : 'Devis'}-${doc.numero}-${(doc.client || 'client').replace(/\s+/g, '-')}.pdf`)
}