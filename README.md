# Chime SMA Translator Library

# About
<br>tekVizion has built an opensource Chime SMA Translator Library to give customers the best of both Amazon Connect and Amazon Chime SDK to help customers to build and execute new or modified IVR workflows in a short time frame with very little code.  The resulting IVR workflows can be used immediately with existing call center solutions and continue to be relevant when migrating fully to Amazon Connect.  The ease of building IVR workflows using the Amazon Connect Flow Builder GUI, combined with the tekVizion Chime SMA Translator Library, results in rich, efficient, and effective workflows backed by the power and flexibility of the Amazon Chime SDK API’s..
 

# Configuring the environment to use the tekVizion Chime SMA Translator Library requires the following steps
<br>1. Create an Amazon Connect Instance
<br>2. Create a Lambda Layer to package the tekVizion library to be used with your Lambda Functions
<br>3. Create a Lambda Function
<br>4. Create a SIP Media Application (SMA)
<br>5. Assign the Lambda Function to the SMA
<br>6. Configure SIP Rule for the SMA



- **Step-1 Create an Amazon Connect Instance**
    <br> For more information on creating an Amazon Connect instance refer to the https://docs.aws.amazon.com/connect/latest/adminguide/amazon-connect-instances.html .     
     <br>* After Creating the  Amazon Connect instance copy the "Instance ARN" from the location (Services -> Amazon Connect -> Click the Name of the Instance -> Distribution settings -> copy Instance ARN) for metioning in the SMA Lambda Function code. Refer the below image.
     ![image](https://user-images.githubusercontent.com/88785130/208022345-99570aa4-2b1e-4564-ba84-dcf35b6fca6c.png)

     <br>* Copy the "Contact Flow ARN" which you defined in the Amazon Connect from the location (Services -> Amazon Connect -> Click the Access url of the Instance -> click Contact Flows -> Show additional flow information -> Copy ARN) for metioning in the SMA Lambda Function code. Rfer the below image.
     <img width="958" alt="image" src="https://user-images.githubusercontent.com/88785130/208022955-f4e852de-4435-48d0-8889-fd1f7dfd6b60.png">

      
    
   
- **Step-2 Create a Lambda Layer to package the tekVizion library to be used with your Lambda Functions**
 <br> 1. Acquire the tekVizion Chime SMA Translator Library,You may choose to use the tekVizion Chime SMA Translator Library as is, or you may choose to clone the github repository, modify, build, and repackage the library yourself

- **Option 1 - Use the tekVizion Chime SMA Translator Library as is**
<br>Download nodejs.zip from the following location https://github.com/tekviziondev/aws-projects/blob/main/sma-contact-flow/chime-sma-translator/nodejs.zip to your local machine.

- **Option 2 - Clone, Build, and Package the tekVizion Chime SMA Translator Library****
 <br> Note : Nodejs has to be installed in your Local Machine
<br>1.  Clone this Git Hub repository to your local machine.
<br>2.  Navigate to the (aws-projects\sma-contact-flow\chime-sma-translator) in the local file system and open the terminal to execute the commands mentioned in the 4th and 5th steps.
<br>3.  Execute the following command to install node_modules "npm i" command 
<br>4.  Execute the following command to compile the library files: "tsc-w"
<br>5.  Create nested folders named exactly as follows: >>mkdir nodejs\node_modules\chime-sma-translator
<br>6.  Copy the newly created **"dist**" folder, the package.json file, and the package-lock.json into  nodejs\node_modules\chime-sma-translator.
<br>7.  Zip the folder "nodejs" to create nodejs.zip where nodejs is the root folder of the zip archive. 


- **Add the tekVizion Chime SMA Translator Library in and Lambda Layer**
<br>1.	Upload the "nodejs.zip" folder into  your "Amazon S3" Bucket location and copy the name of the Bucket froom location (Service -> Amazon S3 -> Buckets -> Copy Bucket Name).(Amazon S3 is a service offered by Amazon Web Services that provides object storage through a web service interface), for more information about "Amazon S3" and "Buckets" refer https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-bucket.html . 
<br>2.	In AWS console choose "Lambda" service and click "Layers" section  (AWS Lambda is a serverless compute service for running code without having to provision or manage servers and Lambda layers provide a convenient way to package libraries and other dependencies that you can use with your Lambda functions) for more information about lambda and layers refer (https://aws.amazon.com/lambda/ , https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html )
<br>3.	After choosing "Layers", create a new layer and name it as you want. Copy the URL of the "nodejs.zip" (Chime SMA Translator Library) location from S3 bucket and paste it in the "Amazon S3 link URLs" section in "layers".
<br>4.	Choose the compatible architectures as x86_64 and compatible runtimes as Node.js 12.x, Node.js 14.x, Noe.js 16.x and select "creaate" option create the Layer. 
<img width="439" alt="image" src="https://user-images.githubusercontent.com/88785130/207815848-60c1eb54-fcfd-43ee-986a-298efb164c4a.png">

- **Step-3 Create a Lambda function**
<br>1. Create a Lambda Function with the SMA Lambda Function code below.This JavaScript file is also available in the github repository. You may refer to https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html for information getting on started with Lambda, creating a Lambda function and invoking it.
<br>2. In the Lambda Function > on the Configuration tab > click Permissions. The Execution role screen appears.
<br>3. Click the link under Role name.The Identity and Access Management (IAM) screen along with the role name appears. 
<br>4. Click the Add permissions button, select Attach policies, and then select the policies as shown in the image and assign them to the role.
   ![image](https://user-images.githubusercontent.com/88785130/205117815-63ea13a3-c6d0-43fd-ac50-e1f6c7cd6734.png)
<br>5.	In the "Lambda" choose "function" section and click "Layers". The Layers section appears.
<img width="880" alt="image" src="https://user-images.githubusercontent.com/88785130/207816542-3a22b0b9-fbb2-412e-a0d5-6206997a702e.png">

<br>6.	Click the "Add a layer" button. The Add layer screen appears.
<img width="876" alt="image" src="https://user-images.githubusercontent.com/88785130/207816798-c363b59b-0b94-4ee2-9e24-39e49561f421.png">

<br>7.	Under "Choose a layer", choose the "Custom layers" option.

<br>8.	From the Custom layers drop-down, select the layer that you created.
<img width="557" alt="image" src="https://user-images.githubusercontent.com/88785130/207817313-820852d9-49aa-41c6-9bec-66daa8cab0e9.png">

<h2>SMA Lambda Function code</h2>
<code>
"use strict";</code>

<code>Object.defineProperty(exports, "__esModule", { value: true });</code>

<code>const sma_contact_flow_parser_1 = require("chime-sma-translator");</code>   //tekVizion SMA-Contact-Flow-Parser Library

<code>const amazonConnectInstanceID = process.env.CONNECT_INSTANCE_ID;</code>  //Amazon Connect Instance ARN  location 

<code>const amazonConnectFlowID = process.env.CONTACT_FLOW_ID;</code>  //Amazon Connect Contact Flow ARN  location

<code>const s3BucketName = process.env.BUCKET_NAME;  </code>  //Bucket Name to Store the Contact flow Response cache 
```js
exports.handler = async (event, context, callback) => {
    let call_Id = event.CallDetails.Participants[0].CallId;
    console.log("CallID :" + call_Id + '| Event recieved from SMA : ' + JSON.stringify(event));
    switch (event.InvocationEventType) {
        case "NEW_INBOUND_CALL":
            try {
                /*
                 * New incoming call event received from Amazon PSTN audio service and tekVizion SMA-Contact-Flow-Parser Library invoked to get the first corresponding SMA action object from the amazon connect contact flow to execute.
                 */
                const actionObj = await sma_contact_flow_parser_1.processFlow(event, amazonConnectInstanceID, amazonConnectFlowID, s3BucketName);
                console.log("CallID :" + call_Id + "| Action Object : " + JSON.stringify(actionObj) + " is going to execute");
                return actionObj;
            }
            catch (e) {
                console.log(e);
            }
            break;
        case "ACTION_SUCCESSFUL":
            try {
                console.log("CallID :" + call_Id + +" |" + event.ActionData.Type + " Action is executed successfully");
                /*
                 *  Action Successfull event received from Amazon PSTN audio service and tekVizion SMA-Contact-Flow-Parser Library invoked to get the corresponding SMA action object from the amazon connect contact flow to execute.
                 */
                const actionObj = await sma_contact_flow_parser_1.processFlow(event, amazonConnectInstanceID, amazonConnectFlowID, s3BucketName);
                console.log("CallID :" + call_Id + "| Action Object : " + JSON.stringify(actionObj) + " is going to execute");
                return actionObj;
            } catch (e) {
                console.log(e);
            }

            break;
        case "ACTION_FAILED":
            try {
                console.log("CallID :" + call_Id + +" |" + event.ActionData.Type + " Action is failed to execute");
                /*
                 *   Action Failed event received from Amazon PSTN audio service and tekVizion SMA-Contact-Flow-Parser Library invoked to get the corresponding SMA action object from the amazon connect contact flow to execute.
                 */
                const actionObj = await sma_contact_flow_parser_1.processFlow(event, amazonConnectInstanceID, amazonConnectFlowID, s3BucketName);
                console.log("CallID :" + call_Id + "| Action Object : " + JSON.stringify(actionObj) + " is going to execute");
                return actionObj;
            } catch (e) {
                console.log(e);
            }
            break;

        case 'HANGUP':
            
            console.log("CallID :" + call_Id + +" | The call is Hanged Up");
            break;
        default:
            return null;
            break;
    }
    callback(null, response);
};

```

- **Step-4 Create a SIP Media Application (SMA)** AND - **Step-5 Assign the Lambda Function to the SMA**
<br> Refer( https://docs.aws.amazon.com/chime-sdk/latest/ag/create-sip-app.html ) on creating SIP Media application and (https://docs.aws.amazon.com/chime/latest/ag/provision-phone.html) for provisioning the phone number
<br>1.	Access the Amazon Chime Service. Under Calling > click SIP media applications.The SIP media application screen appears.
<br>2.	Under Calling > click the Phone number management.The Phone number management screen appears.
<br>3.	Click the Pending tab to provision the phone numbers.
<br>4.	Click the Provision phone numbers tab.The Provision phone numbers screen appears.
<br>5.	Select the SIP Media Application Dial-In option and click Next.
<br>6.	Select the relevant country from the Country drop-down, select the Toll-free option from the dropdown, select the toll-free area code from the drop-down,and click the Search icon.The list of available toll-free numbers appears.
<br>7.	Select any one of the numbers and click the Provision button.The DID number gets provisioned successfully.
<br>8.	Click Create to create a SIP media application.The Create a SIP media application dialog appears.
<br>9.	Enter Name, select the relevant AWS region from the drop-down.
<br>10.	Copy the ARN of the Lambda Function from (Services -> Lambda -> Function -> Select the Function -> Description -> Function ARN) and enter into Lambda Function ARN section .
<img width="459" alt="image" src="https://user-images.githubusercontent.com/88785130/208073349-041b915d-17ae-44af-9901-8092ef4995fb.png">

<br>11.	Click Create to create the SIP media application. The created SIP media application appears under the SIP media applications.
<br>12.	Click the created SIP media application.

![image](https://user-images.githubusercontent.com/88785130/205266463-a806306d-275b-4531-9284-a0e0f49a6ec1.png)

- **Step -6 Configure SIP Rule for the SMA**
 <br>1. Click the Rules tab to create a rule for the SMA and to assign the DID number (Contact Centre Number) to invoke the SMA.
  ![image](https://user-images.githubusercontent.com/88785130/205267206-6b77380c-486a-408a-9b1e-95b0096eec3b.png)
        
  <br>2. Click Create to create a rule. The Create a SIP rule dialog appears.
  <br>3. Enter name of the rule, choose the To phone number from the Trigger type drop-down, select the provisioned phone number from the Phone number drop-down, and click Next. The Create a SIP rule dialog appears.
  <br>4. Click Create. The rule gets created and appears under the created SIP media Application.

  <br>Now your setup is ready to use the tekVizion Library to invoke the SMA's IVR functions.
  
  <br> Click the Contact control panel from Amazon Connect as metioned in the below image, the Web client application will appear.
  
  <img width="959" alt="image" src="https://user-images.githubusercontent.com/88785130/208077005-3027eb18-35cf-4163-af93-26b7f6e2421c.png">

  <br> Use a Web client application from Amazon Connect for Dialing out to the SMA's DID number </br>
  

  ![image](https://user-images.githubusercontent.com/88785130/205262606-0682cee6-864b-40e3-ae21-458ba2c310a4.png)

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

- **Giving Permissions for the UpdateContactRecordingBehavior Action**
<br>For the “UpdateContactRecordingBehavior” action, need to give permission for the S3 bucket, where you want to store our SMA Call Recordings.

- **To give the permission in S3 bucket, perform as follows:**
<br>1. Open the S3 bucket service in AWS.
  ![image](https://user-images.githubusercontent.com/88785130/205296372-607e1a35-c7aa-4a4f-8e33-9439d8c4be3f.png)

<br>2. Open the S3 Bucket where we want to store the SMA call Recordings and click “Permissions”.
  ![image](https://user-images.githubusercontent.com/88785130/205296699-c49d6fac-c90e-4d3c-820c-fa5826ec19ca.png)

<br>3. Under “Bucket policy”, click the “Edit” option.
  ![image](https://user-images.githubusercontent.com/88785130/205296827-4341a93a-e319-4044-9984-30ae0a5431cf.png)

<br>4. Click “Add new statement”.
  ![image](https://user-images.githubusercontent.com/88785130/205297737-808d0e6b-13c2-4263-bc53-068694210183.png)

<br>5. Add the policy that follows in the Existing policy
```
{
			"Sid": "SIP media applicationRead",
			"Effect": "Allow",
			"Principal": {
				"Service": "voiceconnector.chime.amazonaws.com"
			},
			"Action": [
				"s3:PutObject",
				"s3:PutObjectAcl"
			],
			"Resource": "arn:aws:s3:::Your_BucketName /*",
			"Condition": {
				"StringEquals": {
					"s3:x-amz-acl": "bucket-owner-full-control"
				}
			}
		}
```
<br>6. Click “Save changes”.
  ![image](https://user-images.githubusercontent.com/88785130/205488173-d46f498f-318e-43e2-8975-24486de8d63e.png)

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

<br> </br>
<h2>Input parameters user need to give for using tekvizion's Chime SMA Translator Library</h2>
<table>
  <tr>
    <th>Parameter </th>
    <th>Example</th>
  </tr>
  <tr>
    <td>REGION</td>
    <td>us east</td>
  </tr>
  <tr>
    <td>FAILURE_SPEECH_SSML</td>
    <td><img width="896" alt="image" src="https://user-images.githubusercontent.com/88785130/205821179-57910671-19b6-4f47-81cc-f7d894b70f14.png">
</td>
  </tr>
  <tr>
    <td>FAILURE_AUDIO_FILE_LOCATION</td>
    <td>mention you failure audio file's URI from the S3 Bucket</td>
  </tr>
  <tr>
    <td>DESTINATION_LOCATION</td>
    <td>(mention your Bucket name, where you need to store the call Recording)</td>
  </tr>
  <tr>
    <td>CONNECT_INSTANCE_ID</td>
    <td>(mention your Amazon Connect Instance ARN)</td>
  </tr>
  <tr>
    <td>CONTACT_FLOW_ID</td>
    <td>(mention your contact flow ARN)</td>
  </tr>
  <tr>
    <td>BUCKET_NAME</td>
    <td>(mention your Bucket name, where you need to contact flow JSON response)</td>
  </tr>
</table>

- **Configure the Parameter's Key and the Value in Lambda function's configuration section as mentioned in the below image.**

<img width="852" alt="image" src="https://user-images.githubusercontent.com/88785130/208437427-35be13ce-f421-4cf3-9b7a-fb79f33158ef.png">


<h2>Downloading chime-sma-translato package from npm </h2>

```
npm i chime-sma-translator

```
