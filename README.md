# Chime SMA Translator Library

# About
<br>tekVizion has built an opensource Chime SMA Translator Library to give customers the best of both Amazon Connect and Amazon Chime SDK to help customers to build and execute new or modified IVR workflows in a short time frame with very little code.  The resulting IVR workflows can be used immediately with existing call center solutions and continue to be relevant when migrating fully to Amazon Connect.  The ease of building IVR workflows using the Amazon Connect Flow Builder GUI, combined with the tekVizion Chime SMA Translator Library, results in rich, efficient, and effective workflows backed by the power and flexibility of the Amazon Chime SDK API’s..
 

# Configuring the environment to use the tekVizion Chime SMA Translator Library requires the following steps
<br>1. Create an Amazon Connect Instance
<br>2. Create a Lambda Layer and Lambda Function and required S3 Buckets  with acsess roles through AWS CDK script
<br>3. Create a SIP Media Application (SMA)
<br>4. Assign the Lambda Function to the SMA
<br>5. Configure SIP Rule for the SMA



- **Step-1 Create an Amazon Connect Instance**
    <br> For more information on creating an Amazon Connect instance refer to the https://docs.aws.amazon.com/connect/latest/adminguide/amazon-connect-instances.html .     
     <br>* After Creating the  Amazon Connect instance copy the "Instance ARN" from the location (Services -> Amazon Connect -> Click the Name of the Instance -> Distribution settings -> copy Instance ARN) for metioning in the SMA Lambda Function code. Refer the below image.
     ![image](https://user-images.githubusercontent.com/88785130/208022345-99570aa4-2b1e-4564-ba84-dcf35b6fca6c.png)

     <br>* Copy the "Contact Flow ARN" which you defined in the Amazon Connect from the location (Services -> Amazon Connect -> Click the Access url of the Instance -> click Contact Flows -> Show additional flow information -> Copy ARN) for metioning in the SMA Lambda Function code. Rfer the below image.
     <img width="958" alt="image" src="https://user-images.githubusercontent.com/88785130/208022955-f4e852de-4435-48d0-8889-fd1f7dfd6b60.png">
   
- **Step-2 Create a Lambda Layer and Lambda Function and required S3 Buckets  with acsess roles through AWS CDK script**

<br>**Prerequisites**
 <br>1. Node latest version has to be installed in the local machine.
 <br>2. AWS CLI has to be installed and the following parameters has to be configured (security credentials, the default output format, and the default AWS Region)

<br>**Steps for Running the CDK Script**
 <br>1. Download the "aws-project" github repository and open the .env file.
 <br>2. Configure the required inputs in the .env file 

	    region = //the default AWS Region
        connect_instance_id = // Amazon Connect Instance ARN
        contact_flow_id = // Contact Flow ARN
	
   <br>3. Open the folder "chime-sma-translator-cdk" in the terminal and run the "npm install" command to install required node_modules.
   <br>4. After installing required node_modules, run the command "cdk-deploy" to deploy the "ChimeSMATranslatorCdkStack" stack in the CloudFormation of your AWS account, user can refer the SMA Lambda Function ARN in the outputs section of the terminal and bind the ARN while creating the Sip Media Application.
   <br>5. Under the "ChimeSMATranslatorCdkStack" the following resources will be created,
 
	* Layer (chime-sma-translator Library)
	* SMA Lambda function with required access roles and environment variables in the configuration
	* S3 Bucket with Access roles for storing contact flow cache and call recordings.

 
- **Step-3 Create a SIP Media Application (SMA)** AND - **Step-4 Assign the Lambda Function to the SMA**
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

 <br>11. Click Create to create the SIP media application. The created SIP media application appears under the SIP media applications.
 <br>12. Click the created SIP media application.

![image](https://user-images.githubusercontent.com/88785130/205266463-a806306d-275b-4531-9284-a0e0f49a6ec1.png)

- **Step -5 Configure SIP Rule for the SMA**
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
