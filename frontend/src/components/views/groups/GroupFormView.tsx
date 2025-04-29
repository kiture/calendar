import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllGroups } from '../../../redux/group/group.selectors';
import { createGroup, updateGroup } from '../../../redux/group/group.thunks';
import { AppDispatch } from '../../../redux/store';

export const GroupFormView: React.FC = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const groups = useSelector(selectAllGroups);
  const group = groupId ? groups.find((g) => g.group_id === groupId) : null;
  const isEditMode = !!groupId;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const group_name = formData.get('group_name') as string;

    if (isEditMode && groupId) {
      await dispatch(updateGroup({ groupId, group_name }));
    } else {
      await dispatch(createGroup({ group_name }));
    }

    navigate('/groups');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Edit Group' : 'Create New Group'}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Group Name</span>
          </label>
          <input
            type="text"
            name="group_name"
            defaultValue={group?.group_name || ''}
            className="input input-bordered w-full"
            required
          />
        </div>

        <div className="mt-6 flex gap-4">
          <button type="submit" className="btn btn-primary">
            {isEditMode ? 'Update Group' : 'Create Group'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/groups')}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
