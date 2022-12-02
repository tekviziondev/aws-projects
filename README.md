# Contact Flow Parsing Library

# Setup and Environment for using tekVizion's Contact Flow parser Library

- **Amazon Connect Instance creation**
<br>1. Create an instance in the Amazon Connect and define a Contact Flow. You may refer to https://docs.aws.amazon.com/connect/latest/adminguide/amazon-connect-  instances.html for more information on creating an instance in the Amazon Connect.         
![image](https://user-images.githubusercontent.com/88785130/205262411-044949de-39d7-4fe8-b9ab-7a3b3e35eba5.png)

<br>2. Create a DID number in the Amazon Connect.
![image](https://user-images.githubusercontent.com/88785130/205262539-82bda98a-689b-4ad8-9e3f-e2cb10e93f22.png)

<br>3. Use a “Web client” application for Dialing out to the Contact Centre Phone Number (DID). 
![image](https://user-images.githubusercontent.com/88785130/205262606-0682cee6-864b-40e3-ae21-458ba2c310a4.png)


- **Lambda function creation**
<br>1. Create a Lambda Function with the template JavaScript file whichever is available as a part of tekVizion's Library. You may refer https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html for information on  getting started with Lambda, creating a Lambda function, invoking it and so on
<br>2. In the Lambda Function > on the Configuration tab > click Permissions. The Execution role screen appears.
<br>3. Click the link under Role name.The Identity and Access Management (IAM) screen along with the role name appears. 
<br>4. Click the Add permissions button, select Attach policies, and then select the policies as shown in the image and assign them to the role.
  ![image](https://user-images.githubusercontent.com/88785130/205117815-63ea13a3-c6d0-43fd-ac50-e1f6c7cd6734.png)

- **Downloading of tekVizion's Contact Flow parser Library**
<br>1.	Download the tekVizion Library from GitHub and add that library into the Lambda function layers.
<br>2.	Download nodejs.zip (where our sma-contact-flow-parser Library is present) folder from GitHub.
<br>3.	Upload the nodejs.zip file in AWS S3 Bucket. 
<br>4.	In AWS Lambda, choose Layers service. 
<br>5.	After choosing Layers, create a new layer and name it. Copy the URL of the nodejs.zip location from S3 bucket and paste it in the Amazon S3 link URLs.
<br>6.	Choose the compatible architectures as x86_64 and compatible runtimes as Node.js 12.x, Node.js 14.x, Noe.js 16.x. 
<br>8.	In the SMA Lambda function > click Layers. The Layers section appears.
<br>9.	Click the Add a layer button. The Add layer screen appears.
<br>10.	Under Choose a layer, choose the Custom layers option.
<br>11.	From the Custom layers drop-down, select the layer that you created.

- **Creation of SIP Media Application (SMA)**
<br>1.	Create a SIP media application (SMA) and assign the created Lambda Function to it.
<br>2.	Access the Amazon Chime Service. Under Calling > click SIP media applications.The SIP media application screen appears.
<br>3.	Under Calling > click the Phone number management.The Phone number management screen appears.
<br>4.	Click the Pending tab to provision the phone numbers.
<br>5.	Click the Provision phone numbers tab.The Provision phone numbers screen appears.
<br>6.	Select the SIP Media Application Dial-In option and click Next.
<br>7.	Select the relevant country from the Country drop-down, select the Toll-free option from the dropdown, select the toll-free area code from the drop-down,and click the Search icon.The list of available toll-free numbers appears.
<br>8.	Select any one of the numbers and click the Provision button.The DID number gets provisioned successfully.
<br>9.	Click Create to create a SIP media application.The Create a SIP media application dialog appears.
<br>10.	Enter Name, select the relevant AWS region from the drop-down.
<br>11.	Copy the ARN of the Lambda Function and enter in Lambda Function ARN.
<br>12.	Click Create to create the SIP media application. The created SIP media application appears under the SIP media applications.
<br>13.	Click the created SIP media application.

![image](https://user-images.githubusercontent.com/88785130/205266463-a806306d-275b-4531-9284-a0e0f49a6ec1.png)


- **SIP Rule assigning for SIP Media Application (SMA)**
<br>1. Click the Rules tab to create a rule for the SMA and to assign the DID number (Contact Centre Number) to invoke the SMA.
 ![image](https://user-images.githubusercontent.com/88785130/205267206-6b77380c-486a-408a-9b1e-95b0096eec3b.png)
        
<br>2. Click Create to create a rule. The Create a SIP rule dialog appears.
<br>3. Enter name of the rule, choose the To phone number from the Trigger type drop-down, select the provisioned phone number from the Phone number drop-down, and click Next. The Create a SIP rule dialog appears.
<br>4. Click Create. The rule gets created and appears under the created SIP media Application.

- **Defining Amazon Lex Bot service and External Lambda function in Contact Flow** 
<br>1. Use an Amazon lex bot and the external Lambda Function in Amazon Connect Contact flow.
<br>2. Access the Amazon Connect Service. The Amazon Connect virtual contact center instances screen appears.
<br>3. Click the Amazon instance that you created. The Account overview screen appears.
<br>4. Click the Contact flows under Overview on the left side. The Contact flows screen appears.
<br>5. Under Amazon Lex section, select the region of your Amazon Lex bot from Region drop-down, select the bot that you created from the Bot drop-down, select the alias name from the drop-down, and click Add Amazon Lex Bot to use the Lex Bot in the contact flow.
<br>6. Under Aws Lambda section, select the Lambda Function that you created in your account and click Add Lambda Function button to use the Lambda Function in the contact flow. 
<br>7. After that you can able to use the created Lex Bot or External Lambda Function in the Contact Flow blocks of "Invoke AWS Lambda function" and "Amazon Lex" in "Getparticipant Input"





