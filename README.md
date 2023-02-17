# Chime SMA Translator Library

# About
<br>tekVizion has built an opensource Chime SMA Translator Library to give customers the best of both Amazon Connect and Amazon Chime SDK to help customers to build and execute new or modified IVR workflows in a short time frame with very little code.  The resulting IVR workflows can be used immediately with existing call center solutions and continue to be relevant when migrating fully to Amazon Connect.  The ease of building IVR workflows using the Amazon Connect Flow Builder GUI, combined with the tekVizion Chime SMA Translator Library, results in rich, efficient, and effective workflows backed by the power and flexibility of the Amazon Chime SDK API’s..
 

# Configuring the environment to use the tekVizion Chime SMA Translator Library requires the following steps
<br>1. Create an Amazon Connect Instance
<br>2. Create the required resources for using the Chime SMA Translator Library using the AWS CDK script

- **Step-1 Create an Amazon Connect Instance**
    <br> For more information on creating an Amazon Connect instance refer to the https://docs.aws.amazon.com/connect/latest/adminguide/amazon-connect-instances.html .     
     <br>* Copy the "Connect_arn" which you defined in the Amazon Connect from the location (Services -> Amazon Connect -> Click the Access url of the Instance -> click Contact Flows -> Show additional flow information -> Copy ARN) for metioning in the CDK script ".env" file. Refer the below image.
     <img width="958" alt="image" src="https://user-images.githubusercontent.com/88785130/208022955-f4e852de-4435-48d0-8889-fd1f7dfd6b60.png">
   
   
   
- **Step-2 Create the required resources for using the Chime SMA Translator Library using the AWS CDK script**

    <br>**Prerequisites**
 <br>1. Node latest version has to be installed in the local machine.
 <br>2. AWS CLI has to be installed and the following parameters has to be configured (security credentials, the default output format, and the default AWS Region)

    <br>**Steps for Running the CDK Script**
 <br>1. Download the "aws-project" github repository and open the .env file.
 <br>2. Configure the required inputs in the .env file 

	    Connect_arn = //the ARN of the IVR Contact flow defined on the Amazon Connect instance
        Country = // the country where the Chime PhoneNumber has to be provisioned
        Area_code = // the Area code to provision the Chime PhoneNumber
	
   <br>3. Open the folder "chime-sma-translator-cdk" in the terminal and run the "npm install" command to install required node_modules and run the "npm install -g aws-cdk@latest" to enable the CDK deployment of resorces from the local machine.
   <br>4. After installing required node_modules, run the command "cdk deploy", this will provisions the resources like Chime SMA Translator Library as a (Lambda Layer), SMA Lambda function and S3 Bucket with required roles and policies, Chime SIP Media Application, Chime PSTN Phone Numer and Chime SIP rule in the AWS account under the Cloudformation of "chimeSMATranslator" stack.
   <br>5. In the terminal, "outputs:" section user can find the following outputs
   <br>
   <br>**a). chimeSMATranslator.pstnPhoneNumber** you can wait for 5 minutes for complete provisioning of phone number in AWS account and then dial out The PSTN phone number from your phone to perform the IVR flows that defined on the Amazon connect contact flow  
   <br>**b). Stack ARN** You can find the created resource details in the following Cloudformation location
  
  <br> **Sample Outputs from terminal**
	
		Outputs:
		chimeSMATranslator.pstnPhoneNumber = +1234567890 (E.g)
		Stack ARN: arn:aws:cloudformation:us-east-1:12334455666778899:stack/chimeSMATranslator/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (E.g)
   
<h2>Constant Values Used in the Chime SMA Translator Library </h2>
 	 <br> <b>a). S3_BUCKET</b> , has the default name ("chime-sma-traslator")but user can change in Environment variables of SMA Lambda     
	 <br>
	 <br> <b>b). FAILURE_AUDIO_FILE_LOCATION</b>,  has the default wav file in S3 bucket ("s3://chime-sma-traslator/FailureAudio.wav")  but user can change the wav file in S3 bucket  Environment variables of SMA Lambda      
	 <br>
	 <br> <b>c). FAILURE_SPEECH_SSML</b> , has the default SSML value ("<speak> We're sorry. We didn't get that. Please try again. <break time=\"200ms\"/></speak>") but user can change in Environment variables of SMA Lambda Function
	 <br>
	 <br> <b>d). CONNECT_ARN</b> , user has to give the Amzon Connnect Flow ARN in Environment variables of SMA Lambda, if they want to execute another Flow they need to change the ARN      
	 <br>
	 <br> <b>e). Cache Time In Milliseconds</b> for caching the Contact flow data from Amazon Connect , default value is 5000 ms, user cannot change the value
<br>
<br>
<h2>Additional info on</h2>

- **Defining Amazon Lex Bot service and External Lambda function in Contact Flow** 
<br>1. Use an Amazon lex bot and the external Lambda Function in Amazon Connect Contact flow.
<br>2. Access the Amazon Connect Service. The Amazon Connect virtual contact center instances screen appears.
<br>3. Click the Amazon instance that you created. The Account overview screen appears.
<br>4. Click the Contact flows under Overview on the left side. The Contact flows screen appears.
<br>5. Under Amazon Lex section, select the region of your Amazon Lex bot from Region drop-down, select the bot that you created from the Bot drop-down, select the alias name from the drop-down, and click Add Amazon Lex Bot to use the Lex Bot in the contact flow.
<br>6. Under Aws Lambda section, select the Lambda Function that you created in your account and click Add Lambda Function button to use the Lambda Function in the contact flow. 
<br>7. After this, you can use the created Lex Bot or External Lambda Function in the Contact Flow blocks of "Invoke AWS Lambda function" and "Amazon Lex" in "Getparticipant Input."
https://docs.aws.amazon.com/connect/latest/adminguide/amazon-lex.html (for amzon lex) and https://docs.aws.amazon.com/connect/latest/adminguide/connect-lambda-functions.html (invoking AWS lambda)


<br> </br>
<h2>Supported Actions by tekvizion's Chime SMA Translator Library</h2>
- <table>
  <tr>
    <th>S.No.</th>
    <th>Action</th>
    <th>Chime SDK Action</th>
    <th>Function</th>  
  </tr>
  <tr>
    <td>1</td>
    <td>MessageParticipant</td>
    <td>Play AudioSpeak Action</td>
    <td>Messages the participant either by playing the audio or by speaking the text</td>	  
  </tr>
  <tr>
    <td>2</td>
    <td>GetParticipantInput</td>
    <td>Play Audio and get digits Speak and get digits</td>
    <td>Gets the customer input by playing the audio or by speaking the text</td>
  </tr>
<tr>
    <td>3</td>
    <td>DisconnectParticipant</td>
    <td>Hang Up</td>
    <td>Hangs up the current call</td>	  
  </tr>
<tr>
    <td>4</td>
    <td>Wait</td>
    <td>Pause</td>
    <td>Performs pause action</td>	  
  </tr>
<tr>
    <td>5</td>
    <td>Loop</td>
    <td></td>
    <td>Performs the actions iteratively </td>	  
  </tr>
<tr>
    <td>6</td>
    <td>TransferToFlow</td>
    <td></td>
    <td>Transfers the current flow to another flow to perform</td>	  
  </tr>
<tr>
    <td>7</td>
    <td>TransferParticipantToThirdParty</td>
    <td>CallBridge</td>
    <td>Transfers the call to the third-party number</td>	  
  </tr>
<tr>
    <td>8</td>
    <td>ConnectParticipantWithLexBot</td>
    <td>StartBotConversation</td>
    <td>Performs lex bot operations</td>	  
</tr>
<tr>
    <td>9</td>
    <td>UpdateContactRecordingBehavior</td>
    <td>StopCallRecording or StartCallRecording</td>
    <td>Records the call based on the call Id</td>	  
  </tr>
<tr>
    <td>10</td>
    <td>InvokeLambdaFunction</td>
    <td></td>
    <td>Invokes the external Lambda function with inputs and fetch the response</td>	  
  </tr>
<tr>
    <td>11</td>
    <td>UpdateContactAttributes</td>
    <td></td>
    <td>Stores the contact details internally and uses them as an input for Invoking Lambda function and in text to speak </td>	  
  </tr>
<tr>
    <td>12</td>
    <td>Compare</td>
    <td></td>
    <td>Compares the contact attributes with comparison attributes</td>	  
  </tr>
<tr>
    <td>13</td>
    <td>Set Voice ID</td>
    <td></td>
    <td>Sets the voice ID, language, and Engine to speak</td>	  
  </tr>
<tr>
    <td>14</td>
    <td>InvokeFlowModule</td>
    <td></td>
    <td>Invokes the module from the Contact Flow to perform a particular task</td>	  
  </tr>
<tr>
    <td>15</td>
    <td>EndFlowModuleExecution</td>
    <td></td>
    <td>After completing the execution of the module, return backs to original Contact Flow</td>	  
  </tr>

</table>

<h2>Downloading chime-sma-translator package from npm </h2>

```
npm i chime-sma-translator

```
