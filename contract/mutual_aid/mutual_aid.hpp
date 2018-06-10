#include <eosiolib/eosio.hpp>
#include <eosiolib/transaction.hpp>
#include <eosiolib/asset.hpp>

using namespace eosio;

#define risk_rate 100;          
#define contract_ttl 31536000; // time to live, a year

class mutaid: public eosio::contract{
  public:
    mutaid(account_name self):
    contract(self),
        participators(_self, _self){}

    // join the contract
    void join(const account_name renter, const std::string address, const std::string content, const asset& quantity);

    // set the number and price of eosrisk for exchange
    void make(const account_name asker, const uint64_t number, const asset& price);

    // buy eosrisk from someone
    void take(const account_name taker, const account_name from, 
                  const uint64_t number);

    //transfer risk token
    void transfer(const account_name from, const account_name to, const uint64_t number);

    //apply validate event
    void apply(const account_name applicants, const std::string address, const std::string content);

    // claim the profit for eosrisk
    void claim(account_name user);

  private:
    //@abi table
    struct participator
    {
        account_name    owner;
        uint16_t        rate;
        asset           risk_balance;
        time            expiration;
        std::string     content; 
        std::string     address;
        uint64_t        sell_num=0;
        asset           ask;
 
        auto primary_key()const{return owner;}

        EOSLIB_SERIALIZE(participator, (owner)(rate)(risk_balance)(expiration)(content)(address)(sell_num)(ask))
    };

    eosio::multi_index<N(participator), participator> participators;
};

EOSIO_ABI(mutaid, (join)(make)(take)(transfer)(apply)(claim))

