-- Correct the legacy seed only. Leave staff-edited venue identity and copy intact.
update public.saunas
set name = 'Suomiška sauna',
    description = 'Suomiška sauna prie ežero su panoraminiais langais.',
    features = array_remove(features, 'Kūrenama malkomis')
where id = 'pirtis-marse'
  and name = 'Pirtis Marse'
  and description = 'Malkomis kūrenama pirtis prie pat ežero kranto.';
