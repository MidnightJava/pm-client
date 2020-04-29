from bson import ObjectId
import os
from os import path
import pymongo
import json
import jsonpickle
from jsonpickle.pickler import Pickler
from pymongo import MongoClient
from pm_data_types.member import Member, MemberStatus, Sex, MaritalStatus, Transaction, TransactionType, Service, ServiceType
from pm_data_types.address import Address
from pm_data_types.household import Household
from pm_data_types.data_common import CleanPropEncoder
from pm_data_types.data_common import db_name, collection_name

types = [Member, MemberStatus, Sex, MaritalStatus, Transaction, TransactionType, Service, ServiceType, Address, Household]

db_host = "localhost"

"""
Exports all PM data to raw JSON files, i.e. with property names identical to the property names in the python data type classes.
households.json: Household records with all nested data type intances, i.e. Address, Member and its nested typed objects
members.json: A flat list of all Member instances exytracted from all Household records. These Member instances are redundant to
the one included in households.json
"""

def main():
    """Create json file with all households records"""
    CleanPropEncoder.types = [Member, MemberStatus, Sex, MaritalStatus, Transaction,
                              TransactionType, Service, ServiceType, Address, Household]
    client = MongoClient(host=db_host, port=27017)
    db = client[db_name]
    collection = db[collection_name]
    households = []
    for household_dict in collection.find(filter={}):
        household = Household.make_from_mongo_dict(household_dict)
        # Do round trip through encoder to get cleaned property names
        households.append(json.loads(json.dumps(household, cls=CleanPropEncoder)))

    print('%d households found' % len(households))
    with open(path.join(path.dirname(path.realpath(__file__)), 'households.json'), 'w') as f:
        f.write(json.dumps(households))

    members = []
    for obj in collection.find(filter={}, projection = {"_Household__head": 1, "_Household__spouse": 1, "_Household__others": 1}):
        ########################## SUGGESTED MOD ###############################################
        ## Line 48 doesn't work, because I can't actually create a clean dict this way. Since the object returned from mongo
        ## is a JSON object and not a typed instance of Member, python does not call the custom encoder passed as cls
        # head = Member.make_from_clean_dict(json.loads(json.dumps(obj["_Household__head"], cls=CleanPropEncoder)))
        ## This (lines 54 and 56) does work. So perhaps what we need is a Member method make_clean_obj which works from a mongo dict
        ## and returns a json object with cleaned properties. Then lines 52 and 54 can be replaced with a single line which reads:
        ##      members.append(Member.make_clean_object(obj["_Household__head"]))
        ## The cleaned object returned must b recusrively cleaned, which I htink will happen for free in json.dumps()
        ######################################################################################
        head = Member.make_from_mongo_dict(obj["_Household__head"])
        # Do round trip through encoder for each member-type field to get cleaned property names
        members.append(json.loads(json.dumps(head, cls=CleanPropEncoder)))
        if obj.get("_Household__spouse", None) is not None:
            # spouse = Member.make_from_clean_dict(json.loads(json.dumps(obj["_Household__spouse"], cls=CleanPropEncoder)))
            spouse = Member.make_from_mongo_dict(obj["_Household__spouse"])
            members.append(json.loads(json.dumps(spouse, cls=CleanPropEncoder)))
        others = obj["_Household__others"]
        for other in others:
            # other = Member.make_from_clean_dict(json.loads(json.dumps(other, cls=CleanPropEncoder)))
            other = Member.make_from_clean_dict(other)
            members.append(json.loads(json.dumps(other, cls=CleanPropEncoder)))
    print('%d members found' % len(members))
    with open(path.join(path.dirname(path.realpath(__file__)), 'members.json'), 'w') as f:
        f.write(json.dumps(members, cls=CleanPropEncoder))


if __name__ == '__main__':
    main()
