var chain_id = 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f'
var httpEndpoint = 'http://47.97.76.2:8889'

/**
 *  ERROR
 * */
function reject(err,callback) {
    callback({status:false,message:err})
}
/**
 * EOS API
 * */
function getEOS(privateKey) {
    // EOS configuration..
    var config = {
        chainId: chain_id,
        httpEndpoint: httpEndpoint,
        keyProvider:privateKey,
        expireInSeconds: 60
    }
    return Eos(config)
}
function eos_randomAccount(creator,name,creator_privateKey,callback){
    setTimeout(function () {
        // keys
        var _eos_ecc = eos_ecc,
            PrivateKey = _eos_ecc.PrivateKey
        var d = PrivateKey.randomKey()
        var privateKey = d.toWif()
        var publicKey = d.toPublic().toString()


        // New Account
        var eos = getEOS(creator_privateKey)
        eos.transaction( function(tr) {
            tr.newaccount({
                creator: creator,
                name: name,
                owner: publicKey,
                active: publicKey
            }),
            tr.buyrambytes({
                payer: creator,
                receiver: name,
                bytes: 8192
            }),
            tr.delegatebw({
                from: creator,
                receiver: name,
                stake_net_quantity: '0.0100 SYS',
                stake_cpu_quantity: '0.0100 SYS',
                transfer: 0
            })
        }).then(function(result) {
            callback({status:true,message:{'name':name,'publicKey':publicKey,'privateKey':privateKey}})
        }).catch(function(err) {
            reject(err,callback)
        })
    }, 100)
}
function eos_balance(account,callback){
    var eos = getEOS(null)
    eos.getCurrencyBalance("eosio.token",account,"EOS").then(function(result) {
        callback({status:true,message:result})
    }).catch(function(err) {
        reject(err,callback)
    })

}
function eos_transfer(from,to,quantity,memo,from_privateKey,callback){
    var eos = getEOS(from_privateKey)
    // Transfer
    eos.transfer(from,to, quantity, memo,true).then(function(res) {
        callback({status:true,message:res})
    }).catch(function(err) {
        reject(err,callback)
    })
}


/**
 *  House Rental
 *  @param renter 加入账户
 *  @param address 住址
 *  @param content 风险类型
 *  @param renter_privateKey 加入账户的owner私钥
 *  @param callback callback
 * */
function house_rental_join(renter,address,content,renter_privateKey,callback) {
    // keys
    var _eos_ecc = eos_ecc,
        PrivateKey = _eos_ecc.PrivateKey
    var renterPublicKey = PrivateKey.fromWif(renter_privateKey).toPublic().toString()
    // returns Promise
    var eos = getEOS(renter_privateKey);
    var auth = {
        "threshold": 1,
        "keys": [
            {"key": renterPublicKey,"weight": 1}
            ],
        "accounts": [
            {"permission":{"actor":"mutualaideos","permission":"eosio.code"},"weight":1}]
    }
    eos.transaction(function(tr) {
        tr.updateauth({
            account: renter,
            permission: 'active',
            parent: 'owner',
            auth: auth
        })
    }).then(function(result) {
        eos.transaction({
            actions: [
            {
                account: 'mutualaideos',
                name: 'join',
                authorization: [{
                    actor: renter,
                    permission: 'active'
                }],
                data: {
                    renter: renter,
                    address: address,
                    content: content,
                    quantity: '1.0000 EOS'
                }
            }
            ]
         }).then(function(result2) {
            callback({status:true,message:result2})
         }).catch(function(err) {
            reject(err,callback)
         })
    }).catch(function(err) {
        reject(err,callback)
    })
    
}

/**
 *  House Rental - Joined
 *  @param callback callback
 * */
function house_rental_joined(callback) {
    var eos = getEOS(null);
    eos.getTableRows({
        scope: 'mutualaideos',
        code: 'mutualaideos',
        table: 'participator',
        json: true
    }).then(function(res) {
        callback({status:true,message:res})
    }).catch(function(err) {
        reject(err,callback)
    })
}

/**
 *  House Rental - Transfer
 *  @param callback callback
 * */
function house_rental_transfer(callback) {
    var eos = getEOS(null)
    eos.getTableRows({
        scope: 'mutualaideos',
        code: 'mutualaideos',
        table: 'participator',
        json: true
    }).then(function(res) {
        callback({status:true,message:res})
    }).catch(function(err) {
        reject(err,callback)
    })
}

/**
 *  House Rental - sale
 *  @param asker    卖方账号名
 *  @param number   卖出risktoken数量（必须整数）
 *  @param price    多少个EOS
 *  @param asker_privateKey    卖方私钥
 *  @param callback callback
 * */
function house_rental_rnt_sale(asker,number,price,asker_privateKey,callback) {
    var eos = getEOS(asker_privateKey);
    eos.transaction({
        actions: [
            {
                account: 'mutualaideos',
                name: 'make',
                authorization: [{
                    actor: asker,
                    permission: 'active'
                }],
                data: {
                    asker: asker,
                    number: number,
                    price: price
                }
            }
        ]
    }).then(function(result) {
        callback({status:true,message:result})
    }).catch(function(err) {
        reject(err,callback)
    })
}
/**
 *  House Rental - buy
 *  @param buyer    买入方账号名
 *  @param from     卖出方账号名
 *  @param number   买入数量
 *  @param buyer_privateKey   买入方私钥
 *  @param callback callback
 * */
function house_rental_rnt_buy(buyer,from,number,buyer_privateKey,callback) {
    var eos = getEOS(buyer_privateKey);
    eos.transaction({
        actions: [
            {
                account: 'mutualaideos',
                name: 'take',
                authorization: [{
                    actor: buyer,
                    permission: 'active'
                }],
                data: {
                    taker: buyer,
                    from: from,
                    number: number
                }
            }
        ]
    }).then(function(result) {
        callback({status:true,message:result})
    }).catch(function(err) {
        reject(err,callback)
    })
}
/**
 *  House Rental - claim
 *  @param holder    RNT持有者
 *  @param holder_privateKey    RNT持有者私钥
 *  @param callback callback
 * */
function house_rental_rnt_claim(holder,holder_privateKey,callback) {
    var eos = getEOS(holder_privateKey);
    eos.transaction({
        actions: [
            {
                account: 'mutualaideos',
                name: 'claim',
                authorization: [{
                    actor: holder,
                    permission: 'active'
                }],
                data: {
                    user: holder
                }
            }
        ]
    }).then(function(result) {
        callback({status:true,message:result})
    }).catch(function(err) {
        reject(err,callback)
    })
}
/**
 * House Rental - events
 *  @param callback callback
 * */
function house_rental_events(callback) {
    var eos = getEOS(null);
    eos.getTableRows({
        scope: 'validator',
        code: 'validator',
        table: 'event',
        json: true
    }).then(function(result) {
        callback({status:true,message:result})
    }).catch(function(err) {
        reject(err,callback)
    })
}
/**
 *  House Rental - validate
 *  @param verifier 验证管理员
 *  @param event_id 验证事件ID
 *  @param verifier_privateKey 验证管理员私钥
 *  @param callback callback
 * */
function house_rental_validate(verifier,event_id,verifier_privateKey,callback) {
    var eos = getEOS(verifier_privateKey);
    eos.transaction({
        actions: [
            {
                account: 'validator',
                name: 'validate',
                authorization: [{
                    actor: verifier,
                    permission: 'active'
                }],
                data: {
                    verifier: verifier,
                    event_id: event_id
                }
            }
        ]
    }).then(function(result) {
        callback({status:true,message:result})
    }).catch(function(err) {
        reject(err,callback)
    })
}