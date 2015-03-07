//modules
var jsforce = require('jsforce');
var fs = require('fs');
var EasyZip = require("easy-zip").EasyZip;
var ltx = require('ltx');
var express = require('express');
var aws = require('aws-sdk');


var badresponse = 
{
  statuscode: '400',
  message: 'Error',
};

var goodresponse = 
{
  statuscode: '200',
  message: 'Success',
};


//module exports
module.exports = 
{
	push: function(userin, passin, secin, type, callback)
	{
		//connection vars
		var username = userin;
		var password = passin;
		var secToken = secin;
		var metadataapiver = '33.0';

		
		//connection vars
		if(type == 0 || type == 1)
		{
			var conn = new jsforce.Connection(
			{
				loginUrl: 'https://login.salesforce.com/'
			});
		}
		else
		{
			var conn = new jsforce.Connection(
			{
				loginUrl: 'https://test.salesforce.com/'
			});
		}

		//login to salesforce
		conn.login(username, password+secToken, function(err, userInfo)
		{
			if(err)
			{
				return console.error(err);
			}

			var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
			var AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
			var S3_BUCKET = process.env.S3_BUCKET_NAME;

			aws.config.update({accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY});


			var s3 = new aws.S3();
			var params = {Bucket: S3_BUCKET, Key: 'metadata.zip'};

		    
			s3.getObject(params, function(err, data) 
			{
 				if (err) 
 					return console.log(err, err.stack);
  				else 
  				{
  					var dataBuffer = data.Body;
  					console.log(data.Body);
  					console.log(dataBuffer);

					conn.metadata.deploy(dataBuffer, function(err, response)
					{
						if(err) return callback(badresponse);
						asynct(response);
					});
					
  					function asynct(pushStatus)
					{
						if(pushStatus.state == 'InProgress')
						{
							console.log("PushID: " + pushStatus.id + " is in progress...");

							conn.metadata.checkDeployStatus(pushStatus.id, function(err, newPushStatus)
							{
								asynct(newPushStatus);
							});
						}
						else if(pushStatus.state == 'Queued')
						{
							console.log("PushID: " + pushStatus.id + " is queued...");
							conn.metadata.checkDeployStatus(pushStatus.id, function(err, newPushStatus)
							{
								asynct(newPushStatus);
							});
						}
						else if(pushStatus.state == 'Succeeded')
						{
							console.log("PushID: " + pushStatus.id + " was successfull...");
						}
						else
						{
							console.log("PushID: " + pushStatus.id + " has encountered an error or unknown exception");
						}
					}
							//end push constructor


							//push
					
				}
			});
		});
	}
};








