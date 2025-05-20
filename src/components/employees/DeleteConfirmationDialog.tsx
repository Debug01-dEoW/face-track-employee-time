
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { hasFaceData } from "@/services/FaceDatabase";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  employeeName: string;
  employeeId?: number;
}

const DeleteConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  employeeName,
  employeeId,
}: DeleteConfirmationDialogProps) => {
  const hasFace = employeeId ? hasFaceData(employeeId) : false;

  const handleDelete = () => {
    onConfirm();
    onOpenChange(false);
    toast.success("Employee deleted successfully");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Employee</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {employeeName}? This action cannot be undone.
            {hasFace && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                Note: This will also remove all enrolled face data for this employee.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Delete Employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
