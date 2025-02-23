// Defining a data model.
class Quote {
  quote_amount float? @description("The amount that was quoted.")
  notes string @description("Any additional notes or caveats about the product or service or quote.")
}

// Create a function to extract the resume from a string.
function ExtractQuote(transcript: string) -> Quote {
  // Specify a client as provider/model-name
  // you can use custom LLM params with a custom client name from clients.baml like "client CustomHaiku"
  client CustomSonnet
  prompt #"
    Extract information from this call transcript:
    {{ transcript }}

    {{ ctx.output_format }}
  "#
}