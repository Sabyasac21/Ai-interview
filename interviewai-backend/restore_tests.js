db.questions.updateOne({question_id:'dsa-10'}, {$set:{test_cases:[
  {input:{arr:[5,2,8,1,9]}, expected:[1,2,5,8,9], hidden:false},
  {input:{arr:[1,2,3]}, expected:[1,2,3], hidden:false},
  {input:{arr:[3,2,1]}, expected:[1,2,3], hidden:false},
  {input:{arr:[64,34,25,12,22,11,90]}, expected:[11,12,22,25,34,64,90], hidden:true}
]}});
print('restored');