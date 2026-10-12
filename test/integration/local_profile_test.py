import json,pathlib,tempfile,sys,unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[2]/'control'))
from aletheia_store import CustodyStore
from aletheia_worker import dispatch
class LocalProfileTest(unittest.TestCase):
 def test_profiles_are_independent_and_empty_sources_stay_empty(self):
  with tempfile.TemporaryDirectory() as directory:
   base=pathlib.Path(directory)
   first=base/'first';second=base/'second';first.mkdir();second.mkdir()
   (first/'local-profile.json').write_text(json.dumps({'sources':{'source':str(base/'source.sqlite')},'snapshots':[str(base/'a'),str(base/'b'),str(base/'c')],'registry':str(base/'registry.json')}))
   a=CustodyStore(first);b=CustodyStore(second)
   self.assertEqual(len(dispatch(a,'snapshotSources',{})['sources']),3)
   self.assertEqual(dispatch(b,'snapshotSources',{})['sources'],[])
   self.assertEqual(b.sources,{})
   self.assertEqual(CustodyStore(first,sources={}).sources,{})
   self.assertEqual(a.profile_path('registry'),base/'registry.json')
   with self.assertRaises(ValueError): b.profile_path('registry')
