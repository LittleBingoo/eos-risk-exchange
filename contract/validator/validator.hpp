#include <eosiolib/eosio.hpp>

using namespace eosio;

class validator: public eosio::contract{
  public:
    validator(account_name self):
        contract(self),
        events(_self, _self)
    {}
    
    // add events
    void add(const account_name user, const std::string address, const std::string content);

    //apply validate event
    void apply(const account_name applicants, const std::string address, const std::string content);

    // validate the authenticity of event
    void validate(const account_name verifier, const uint64_t event_id, uint16_t status);

    // check event under given conditions
    void check(const time from, const time to, const std::string address, const std::string content);
  
  private:
    //@abi table
    struct event
    {
        uint64_t        id;
        time            event_time;
        std::string     content; 
        std::string     address;
        uint16_t        confirmed;
 
        auto  primary_key()const{return id;}

        EOSLIB_SERIALIZE(event, (id)(event_time)(content)(address)(confirmed))
    };

    eosio::multi_index<N(event), event> events;
    
};

EOSIO_ABI(validator, (add)(apply)(validate)(check))
