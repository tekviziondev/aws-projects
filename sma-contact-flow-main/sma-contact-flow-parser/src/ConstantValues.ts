 type Data = {
    voiceId: string;
    engine: string;
    languageCode:string;
    text:string;
    ssml:string;
    region:string;
  };

  export const ConstData: Data = {
    voiceId: "Joanna",
    engine: "neural",
    languageCode:"en-US",
    text:"text",
    ssml:"ssml",
    region:"us-east-1"
  }