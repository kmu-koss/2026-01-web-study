$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$sourceTxt = Join-Path $PSScriptRoot "week3-report-example.txt"
$docxPath = Join-Path $PSScriptRoot "week3-report-example.docx"
$hwpPath = Join-Path $PSScriptRoot "week3-report-example.hwp"

if (-not (Test-Path $sourceTxt)) {
  throw "Source text file not found: $sourceTxt"
}

$rawLines = Get-Content -LiteralPath $sourceTxt -Encoding UTF8

function Escape-Xml {
  param([string]$Text)

  if ($null -eq $Text) {
    return ""
  }

  return [System.Security.SecurityElement]::Escape($Text)
}

function New-WordParagraphXml {
  param(
    [string]$Text,
    [ValidateSet("title", "heading", "bullet", "body", "blank")]
    [string]$Kind
  )

  if ($Kind -eq "blank") {
    return "<w:p/>"
  }

  $escapedText = Escape-Xml $Text

  switch ($Kind) {
    "title" {
      return @"
<w:p>
  <w:pPr>
    <w:jc w:val="center"/>
    <w:spacing w:before="120" w:after="240"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:b/>
      <w:sz w:val="32"/>
    </w:rPr>
    <w:t xml:space="preserve">$escapedText</w:t>
  </w:r>
</w:p>
"@
    }
    "heading" {
      return @"
<w:p>
  <w:pPr>
    <w:spacing w:before="220" w:after="100"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:b/>
      <w:sz w:val="24"/>
    </w:rPr>
    <w:t xml:space="preserve">$escapedText</w:t>
  </w:r>
</w:p>
"@
    }
    "bullet" {
      return @"
<w:p>
  <w:pPr>
    <w:ind w:left="720" w:hanging="360"/>
    <w:spacing w:after="40"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:sz w:val="22"/>
    </w:rPr>
    <w:t xml:space="preserve">• $escapedText</w:t>
  </w:r>
</w:p>
"@
    }
    default {
      return @"
<w:p>
  <w:pPr>
    <w:spacing w:after="80" w:line="360" w:lineRule="auto"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:sz w:val="22"/>
    </w:rPr>
    <w:t xml:space="preserve">$escapedText</w:t>
  </w:r>
</w:p>
"@
    }
  }
}

function Build-Docx {
  param(
    [string[]]$Lines,
    [string]$OutputPath
  )

  $tempRoot = Join-Path $env:TEMP ("week3-docx-" + [guid]::NewGuid().ToString("N"))
  $null = New-Item -ItemType Directory -Path $tempRoot
  $null = New-Item -ItemType Directory -Path (Join-Path $tempRoot "_rels")
  $null = New-Item -ItemType Directory -Path (Join-Path $tempRoot "word")

  $paragraphs = New-Object System.Collections.Generic.List[string]

  for ($i = 0; $i -lt $Lines.Count; $i++) {
    $line = $Lines[$i]

    if ($i -eq 0) {
      $paragraphs.Add((New-WordParagraphXml -Text $line -Kind "title"))
      continue
    }

    if ([string]::IsNullOrWhiteSpace($line)) {
      $paragraphs.Add((New-WordParagraphXml -Text "" -Kind "blank"))
      continue
    }

    if ($line -match '^\d+\.\s') {
      $paragraphs.Add((New-WordParagraphXml -Text $line -Kind "heading"))
      continue
    }

    if ($line -match '^- ') {
      $paragraphs.Add((New-WordParagraphXml -Text $line.Substring(2) -Kind "bullet"))
      continue
    }

    $paragraphs.Add((New-WordParagraphXml -Text $line -Kind "body"))
  }

  $documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp14">
  <w:body>
$(($paragraphs -join "`n"))
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

  $contentTypesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
"@

  $relsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"@

  Set-Content -LiteralPath (Join-Path $tempRoot "[Content_Types].xml") -Value $contentTypesXml -Encoding UTF8
  Set-Content -LiteralPath (Join-Path $tempRoot "_rels\.rels") -Value $relsXml -Encoding UTF8
  Set-Content -LiteralPath (Join-Path $tempRoot "word\document.xml") -Value $documentXml -Encoding UTF8

  if (Test-Path $OutputPath) {
    Remove-Item -LiteralPath $OutputPath -Force
  }

  $zipPath = [System.IO.Path]::ChangeExtension($OutputPath, ".zip")

  if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }

  Compress-Archive -Path (Join-Path $tempRoot "*") -DestinationPath $zipPath -CompressionLevel Optimal
  Move-Item -LiteralPath $zipPath -Destination $OutputPath
  Remove-Item -LiteralPath $tempRoot -Recurse -Force
}

function Build-Hwp {
  param(
    [string[]]$Lines,
    [string]$OutputPath
  )

  $hwp = $null

  try {
    $hwp = New-Object -ComObject HWPFrame.HwpObject
    $hwp.XHwpWindows.Item(0).Visible = $false
    $fullText = $Lines -join "`r`n"

    $hwp.HAction.GetDefault("InsertText", $hwp.HParameterSet.HInsertText.HSet)
    $hwp.HParameterSet.HInsertText.Text = $fullText
    $hwp.HAction.Execute("InsertText", $hwp.HParameterSet.HInsertText.HSet) | Out-Null

    if (Test-Path $OutputPath) {
      Remove-Item -LiteralPath $OutputPath -Force
    }

    $hwp.SaveAs($OutputPath, "HWP", "")
  }
  finally {
    if ($null -ne $hwp) {
      $hwp.Quit()
    }
  }
}

Build-Docx -Lines $rawLines -OutputPath $docxPath
Build-Hwp -Lines $rawLines -OutputPath $hwpPath

Write-Output "Created:"
Write-Output $sourceTxt
Write-Output $docxPath
Write-Output $hwpPath
