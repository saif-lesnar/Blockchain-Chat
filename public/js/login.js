'use strict';

var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');
var qs = require('querystring');
var bcrypt = require('bcrypt');
const saltRounds = 10;
//
var fabric_client = new Fabric_Client();

// setup the fabric network
var channel = fabric_client.newChannel('mychannel');
var peer = fabric_client.newPeer('grpc://localhost:7051');
//
var member_user = null;
var store_path = path.join(__dirname, '/../../hfc-key-store');
console.log('Store path:'+store_path);
var tx_id = null;

init();

function init() {
	channel.addPeer(peer);
}

module.exports.login = function(request,res){
    var account_no = request.body.account_no;
    var email = request.body.email_id;
    var password =  request.body.user_password;
    console.log("Reading:email "+ email + 'account_no' +account_no);
    // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {
        // assign the store to the fabric client
        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        // use the same location for the state store (where the users' certificate are kept)
        // and the crypto store (where the users' keys are kept)
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);

        // get the enrolled user from persistence, this user will sign all requests
        return fabric_client.getUserContext('user1', true);
    }).then((user_from_store) => {
        if (user_from_store && user_from_store.isEnrolled()) {
            console.log('Successfully loaded user1 from persistence');
            member_user = user_from_store;
        } else {
            throw new Error('Failed to get user1.... run registerUser.js');
        }

        // queryCar chaincode function - requires 1 argument, ex: args: ['CAR4'],
        // queryAllCars chaincode function - requires no arguments , ex: args: [''],

        const request = {
            //targets : --- letting this default to the peers assigned to the channel
            chaincodeId: 'blockchainChatbot',
            //fcn: 'queryAllCars',
            //args: ['']
            fcn: 'login',
            //'a0123c'
            args: [account_no]
        };
        console.log(request);
        // send the query proposal to the peer
        return channel.queryByChaincode(request);
    }).then((query_responses) => {
        console.log("Query has completed, checking results");
        // query_responses could have more than one  results if there multiple peers were used as targets
				console.log(query_responses);
        if (query_responses && query_responses.length == 1) {
					if(query_responses[0] == 0){
						console.log("user is not in the chain");
						res.redirect("/");
					}
          else  if (query_responses[0] instanceof Error) {
                console.error("error from query = ", query_responses[0]);

            } else {
                //console.log("Response is ", JSON.stringify(query_responses[0].toString()));
                //console.log("Response is ", query_responses[0].toString());
                var data = query_responses[0];
                console.log("Response is ", data.toString());
                var obj = JSON.parse(data.toString());
                console.log("password is  ", obj['password']);
                var passwordVerification = obj['password'];
                if(bcrypt.compareSync(password, passwordVerification)){
									request.session.accno = request.body.account_no;
									res.render("userindex");
                } else  {
                  console.log("provide correct password");
                  res.redirect("/");
                }

								//var obj = JSON.parse(data.toString());
								//console.log("Actors are  ", obj['actors']);
								//console.log("Response is ", JSON.stringify(data));
                //res.setHeader('Content-Type', 'application/json');
                //res.send(data.toString());
            }
        } else {
            console.log("No payloads were returned from query");
        }
    }).catch((err) => {
        console.error('Failed to query successfully :: ' + err);
    });
}
