import * as dotenv from 'dotenv';
dotenv.config();
const {
    region,
    Failure_Speech_SSML,
    Failure_Audio_Location,
    connect_instance_id ,
    contact_flow_id
  } = process.env;

  type Data = {
    REGION: any;
    S3_BUCKET: any;
    FAILURE_SPEECH_SSML: any,
    FAILURE_AUDIO_FILE_LOCATION: any,
    CONNECT_INSTANCE_ID:any,
    CONTACT_FLOW_ID:any
  };

  // Environment Variables for Lambda Function
  export var Attributes : Data = {
    REGION:  region,
    FAILURE_SPEECH_SSML: "<speak> We're sorry. We didn't get that. Please try again. <break time=\"200ms\"/></speak>",
    FAILURE_AUDIO_FILE_LOCATION: "s3://chime-sma-traslator/FailureAudio.wav",
    S3_BUCKET: "chime-sma-traslator",
    CONNECT_INSTANCE_ID:connect_instance_id,
    CONTACT_FLOW_ID:contact_flow_id
  }