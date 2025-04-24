import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  selectSelectedGroupId,
  selectUserGroups,
} from '../../redux/group/group.selectors';
import { setSelectedGroupId } from '../../redux/group/group.reducer';

export const GroupsManagementView: React.FC = () => {
  const groups = useSelector(selectUserGroups);
  const dispatch = useDispatch();
  const selectedGroupId = useSelector(selectSelectedGroupId);

  const handleSwitchGroup = (groupId: string) => {
    dispatch(setSelectedGroupId(groupId));
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Groups Management</h1>
        <Link to="/groups/create" className="btn btn-primary">
          Create New Group
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div key={group.group_id} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">{group.group_name}</h2>
              <div className="card-actions justify-end mt-4 flex-wrap gap-2">
                {selectedGroupId !== group.group_id && (
                  <button
                    onClick={() => handleSwitchGroup(group.group_id)}
                    className="btn btn-secondary"
                  >
                    Switch Group
                  </button>
                )}
                <Link
                  to={`/groups/${group.group_id}/edit`}
                  className="btn btn-primary"
                >
                  Edit Group
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
