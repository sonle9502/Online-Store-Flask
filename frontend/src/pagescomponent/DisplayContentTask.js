// DisplayContentTask.jsx
import React from 'react';
import styled from 'styled-components';

const TaskDetails = styled.div`
  flex: 1;
  padding: 20px;
  border: 1px solid #ddd;
  background-color: #f9f9f9;
`;

const Form = styled.form`
  .form-label {
    margin-bottom: 8px;
    font-weight: bold;
  }
  .btn-custom-update {
    margin-top: 10px;
  }
`;

const DisplayContentTask = ({ task, handleUpdate }) => {
  if (!task) {
    return <p>Loading task data...</p>;
  }

  return (
    <TaskDetails>
      <Form onSubmit={handleUpdate} className="wide-form mb-4">
        <div className="mb-3">
          <label htmlFor="content" className="form-label">商品:</label>
          <input
            type="text"
            id="content"
            name="content"
            className="form-control"
            defaultValue={task.content}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description:</label>
          <textarea
            id="description"
            name="description"
            className="form-control"
            defaultValue={task.description}
            rows={3}  // 必要に応じて行数を調整
          />
        </div>
        <button type="submit" className="btn btn-custom-update">Update Task</button>
      </Form>
    </TaskDetails>
  );
};

export default DisplayContentTask;
