import DashboardLayout from '../components/DashboardLayout'
import LifeModeParentPanel from '../lifeMode/LifeModeParentPanel'

const navItems = [{ id: 'life', label: 'Life Mode' }]

function ParentDashboard() {
  return (
    <DashboardLayout role="parent" navItems={navItems} activeTab="life" onTabChange={() => {}} showCoach={false}>
      <LifeModeParentPanel parentName="Alex" teenName="Jamie" />
      <p className="dashboard-footnote">
        Hackathon demo — Parent and Teen share one Life Mode. No real banking, credit, or money movement.
      </p>
    </DashboardLayout>
  )
}

export default ParentDashboard
