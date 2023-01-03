import * as dotenv from 'dotenv';
dotenv.config();
const {
    region,
    Failure_Speech_SSML,
    Failure_Audio_Location,
    callrecordings_s3_bucket,
    flow_cache_s3_bucket ,
    connect_instance_id ,
    contact_flow_id
  } = process.env;

  type Data = {
    REGION: any;
    CALL_RECORDINGS_S3_BUCKET: any;
    FAILURE_SPEECH_SSML: any,
    FAILURE_AUDIO_FILE_LOCATION: any,
    FLOW_CACHE_S3_BUCKET:any,
    CONNECT_INSTANCE_ID:any,
    CONTACT_FLOW_ID:any
  };

  // Environment Variables for Lambda Function
  export const Attributes : Data = {
    REGION:  region,
    CALL_RECORDINGS_S3_BUCKET: callrecordings_s3_bucket,
    FAILURE_SPEECH_SSML: Failure_Speech_SSML,
    FAILURE_AUDIO_FILE_LOCATION: Failure_Audio_Location,
    FLOW_CACHE_S3_BUCKET: flow_cache_s3_bucket,
    CONNECT_INSTANCE_ID:connect_instance_id,
    CONTACT_FLOW_ID:contact_flow_id
  }