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
        #This beraks unless we add a custom decoder. We should do that in the typed object instead of here.
        households.append(json.loads(json.dumps(household)))

    print('%d households found' % len(households))
    with open(path.join(path.dirname(path.realpath(__file__)), 'households.json'), 'w') as f:
        f.write(json.dumps(households))

    members = []
    for obj in collection.find(filter={}, projection = {"_Household__head": 1, "_Household__spouse": 1, "_Household__others": 1}):
        head = Member.make_from_mongo_dict(obj["_Household__head"])
        members.append(head)
        if obj.get("_Household__spouse", None) is not None:
            spouse = Member.make_from_mongo_dict(obj["_Household__spouse"])
            members.append(spouse)
        others = obj["_Household__others"]
        for other in others:
            other = Member.make_from_clean_dict(other)
            members.append(other)
    print('%d members found' % len(members))
    with open(path.join(path.dirname(path.realpath(__file__)), 'members.json'), 'w') as f:
        #same issue as above with households.
        f.write(json.dumps(members))

if __name__ == '__main__':
    main()
