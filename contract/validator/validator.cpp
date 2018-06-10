#include <validator.hpp>
#include <eosiolib/print.hpp>

using namespace eosio;

void validator::add(const account_name user, const std::string address, const std::string content)
{
    eosio_assert(has_auth(user), "insufficient authority!");

    auto itr = events.emplace(_self, [&](auto& event){
        event.id = events.available_primary_key();
        event.content = content;
        event.address = address;
        event.confirmed = 0;
    });

    print("The event add success!!!");
}

void validator::apply(const account_name applicants, const std::string address, const std::string content)
{
    eosio_assert(has_auth(applicants), "insufficient authority!");
    
    for( const auto& item : events )
    {
        if (item.address == address && item.content == content)
            events.modify(item, _self, [&](auto& event){
                event.confirmed = 1;
            });
    }
}

void validator::validate(const account_name verifier, const uint64_t event_id, uint16_t status)
{
    eosio_assert(has_auth(verifier), "insufficient authority!");

    auto itr = events.find(event_id);
    eosio_assert(itr != events.end(), "the event is not exist");

    events.modify(itr, _self, [&](auto& event){
        event.confirmed = status;
        event.event_time = now();
    });

    print("the event ", event_id, " has been validated.");
}

void validator::check(const time from, const time to, const std::string address, const std::string content)
{
    for( const auto& item : events ) {
        if (item.address == address && item.content == content)
            if (item.event_time >= from && item.event_time <= to && item.confirmed == 2)
                return;
    }
    eosio_assert(false, "validate failed");
}
