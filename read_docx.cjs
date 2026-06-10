const mammoth = require("mammoth");

async function extract() {
  try {
    const doc1 = await mammoth.extractRawText({path: "private_transfer_project_specification (1).docx"});
    console.log("=== DOC 1: private_transfer_project_specification (1).docx ===");
    console.log(doc1.value);

    const doc2 = await mammoth.extractRawText({path: "final_private_transfer_specification.docx"});
    console.log("=== DOC 2: final_private_transfer_specification.docx ===");
    console.log(doc2.value);
  } catch(e) {
    console.error(e);
  }
}

extract();
